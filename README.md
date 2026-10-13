# AWS Event Announcement System

A serverless web application for creating and displaying events, with email notifications when new events are published.

## Features

- Create and display events through a web interface.
- Store event data persistently in Amazon DynamoDB.
- Send email notifications using Amazon SNS.
- Serve the frontend using Amazon S3 and CloudFront.
- Process API requests using Amazon API Gateway and AWS Lambda.

## Architecture

S3 + CloudFront → API Gateway → Lambda → DynamoDB

When a new event is created, Lambda stores it in DynamoDB and publishes a notification through Amazon SNS.

## AWS Services Used

- Amazon S3
- Amazon CloudFront
- Amazon API Gateway
- AWS Lambda
- Amazon DynamoDB
- Amazon SNS
- AWS IAM
- Amazon CloudWatch

## Project Status

The core event creation, storage, retrieval, and email notification workflows have been implemented and tested.

Automatic event-date reminders are not implemented yet.

## Learning Outcomes

- Building a serverless application on AWS
- Integrating API Gateway with Lambda
- Persisting application data in DynamoDB
- Sending email notifications with SNS
- Configuring IAM permissions and CloudFront access

## Security

Do not commit AWS access keys, passwords, secrets, or private subscriber information. Review IAM policies and configuration before deploying this project in another AWS account.

## Author

VASANTH
<img width="1920" height="1020" alt="image" src="https://github.com/user-attachments/assets/7e0821a9-4dce-42b3-b200-e54948d23178" />
