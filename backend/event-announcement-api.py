
import json
import os
import uuid
import boto3
from datetime import date

dynamodb = boto3.resource("dynamodb")
sns = boto3.client("sns")

table = dynamodb.Table(
    os.environ.get("EVENTS_TABLE", "Events")
)
topic_arn = os.environ.get("SNS_TOPIC_ARN", "")


def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
        },
        "body": json.dumps(body, default=str)
    }


def lambda_handler(event, context):
    method = event.get("httpMethod", "GET")

    if method == "OPTIONS":
        return response(200, {"message": "OK"})

    if method == "GET":
        result = table.scan()
        events = result.get("Items", [])

        while "LastEvaluatedKey" in result:
            result = table.scan(
                ExclusiveStartKey=result["LastEvaluatedKey"]
            )
            events.extend(result.get("Items", []))

        return response(200, events)

    if method == "POST":
        try:
            body = event.get("body") or "{}"
            if isinstance(body, str):
                body = json.loads(body)

            title = body.get("title", "").strip()
            event_date = body.get("date", "")
            location = body.get("location", "").strip()
            description = body.get("description", "").strip()
            category = body.get("category", "Workshop").strip()

            if not all([title, event_date, location, description]):
                return response(400, {
                    "error": "Title, date, location and description are required."
                })

            date.fromisoformat(event_date)

            item = {
                "eventId": str(uuid.uuid4()),
                "title": title,
                "date": event_date,
                "location": location,
                "description": description,
                "category": category
            }

            table.put_item(Item=item)

            # Publish the announcement after saving the event.
            if topic_arn:
                message = (
                    f"New event: {title}\n\n"
                    f"Date: {event_date}\n"
                    f"Location: {location}\n"
                    f"Category: {category}\n\n"
                    f"{description}"
                )

                try:
                    sns.publish(
                        TopicArn=topic_arn,
                        Subject=f"New event: {title}"[:100],
                        Message=message
                    )
                except Exception:
                    # The event is already saved. Report notification
                    # failure without pretending the publish succeeded.
                    print("SNS publish failed")
                    raise

            return response(201, item)

        except (ValueError, TypeError):
            return response(400, {
                "error": "Invalid request body or date. Use YYYY-MM-DD."
            })

    return response(405, {"error": "Method not allowed."})
