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

<img width="1672" height="941" alt="AWS Event Announcement Architecture Diagram" src="https://github.com/user-attachments/assets/d683baeb-5c89-45e6-bb88-01a1fe2b7fad" />


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

## Configuration steps
[AWS_Event_Announcement_System_Configuration_Steps.pdf](https://github.com/user-attachments/files/33392116/AWS_Event_Announcement_System_Configuration_Steps.pdf)


## Learning Outcomes

- Building a serverless application on AWS
- Integrating API Gateway with Lambda
- Persisting application data in DynamoDB
- Sending email notifications with SNS
- Configuring IAM permissions and CloudFront access

## Security

Do not commit AWS access keys, passwords, secrets, or private subscriber information. Review IAM policies and configuration before deploying this project in another AWS account.

## Application images
<img width="1920" height="1020" alt="Screenshot 2026-10-13 201412" src="https://github.com/user-attachments/assets/120a0c23-281b-40d4-bfb0-a17fa27f90a3" />
<img width="1920" height="1020" alt="Screenshot 2026-10-13 201455" src="https://github.com/user-attachments/assets/a07e9602-afed-4310-9bff-1a010ae9ddf6" />
<img width="1920" height="1020" alt="Screenshot 2026-10-13 201524" src="https://github.com/user-attachments/assets/8f7371fd-21c9-494c-85a0-98c1e731bf03" />

## Mail image
<img width="1920" height="1020" alt="image" src="https://github.com/user-attachments/assets/fc006c2c-36a5-4116-b89e-539578d88924" />



## Author

VASANTH

