# LogoPulse - Intelligent Logo Detection Platform

**LogoPulse** is a cloud-based logo detection application built on Amazon Web Services (AWS), designed to identify logos in images with ease and precision. Featuring a user-friendly web interface for uploading images and viewing results, LogoPulse leverages AWS's powerful AI and serverless technologies to deliver a seamless and scalable experience. Perfect for businesses, developers, and tech enthusiasts, LogoPulse showcases the potential of cloud-driven AI solutions.

## Features

- **Smart Logo Detection**: Upload JPEG or PNG images, and LogoPulse uses AWS Rekognition to detect logos with high accuracy, complete with confidence scores and bounding boxes.
- **Interactive Web Interface**: A sleek Node.js frontend allows users to upload images, preview them, view detection results, and explore upload history—all in a visually engaging format.
- **Real-Time Notifications**: Receive instant email updates via AWS SNS for every logo detection, keeping you informed at every step.
- **Scalable Architecture**: Built with serverless AWS Lambda functions and scalable services like S3 and DynamoDB, LogoPulse is designed to handle growing user demands effortlessly.
- **Secure Deployment**: Hosted on an EC2 instance within a custom VPC, the application ensures secure access with restricted network traffic.
- **Automated Setup**: AWS CloudFormation automates the infrastructure deployment, making it easy to replicate and scale the application.

## Architecture

LogoPulse combines the power of AWS services to create a robust and efficient logo detection system:

- **Frontend**: A Node.js application hosted on an EC2 instance, providing an intuitive interface for image uploads and result visualization.
- **Backend**:
  - **S3**: Securely stores uploaded images with public read access for easy retrieval.
  - **Lambda Functions**: Handle image uploads, logo detection with AWS Rekognition, result retrieval, and history management.
  - **API Gateway**: Routes frontend requests to Lambda functions securely.
  - **DynamoDB**: Stores detection results for fast and reliable access.
  - **SNS**: Sends real-time email notifications for detection updates.
  - **EC2**: Hosts the frontend in a secure VPC with controlled access.

### Architecture Diagram

Below is a conceptual overview of LogoPulse's architecture:

![Term_Project_Architech](https://github.com/user-attachments/assets/f4af9028-1a99-4d1f-8e4f-4883de7c83bc)

- **Frontend (EC2)**: Serves the Node.js web app for user interaction.
- **API Gateway**: Connects the frontend to backend Lambda functions.
- **Lambda Functions**: Process image uploads, detect logos, and manage results.
- **S3**: Stores images securely.
- **DynamoDB**: Manages detection metadata.
- **SNS**: Delivers email notifications.

## Prerequisites

To deploy and run LogoPulse, ensure you have:

- **AWS Account**: Configured with access to the `us-east-1` region.
- **AWS CLI**: Installed and configured with credentials (`aws configure`).
- **Node.js**: Version 18.x or later for frontend development.
- **Git**: For cloning the repository.
- **Text Editor**: VS Code or similar for code editing.

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/LogoPulse.git
cd LogoPulse
```

### 2. Configure AWS Credentials

```bash
aws configure
```

### 3. Set Up Email Notifications

- Open `infrastructure/logo_detection_infrastructure.yaml`.
- Locate the `ResultsRetrieverLambda` environment section.
- Set your email address by editing:

```python
EMAIL_ADDRESS = 'your-email@example.com'
```

### 4. Deploy Infrastructure with CloudFormation

- Navigate to the infrastructure directory:

```bash
cd infrastructure
```

- Deploy the CloudFormation stack:

```bash
aws cloudformation create-stack \
  --stack-name LogoPulseStack \
  --template-body file://logo_detection_infrastructure.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameters ParameterKey=KeyName,ParameterValue=<your-key-pair-name>
```

> Replace `<your-key-pair-name>` with your EC2 key pair name.

- Monitor stack deployment:

```bash
aws cloudformation describe-stacks --stack-name LogoPulseStack
```

- Note down the outputs: `ApiEndpoint`, `S3BucketName`, and `EC2PublicIP`.

### 5. Deploy the Frontend

- Navigate to the frontend directory:

```bash
cd ../frontend
```

- Install Node.js dependencies:

```bash
npm install
```

- Create a `.env` file using CloudFormation outputs:

```text
API_GATEWAY_URL=<ApiEndpoint>
S3_BUCKET_NAME=<S3BucketName>
```

- Copy the frontend code to the EC2 instance:

```bash
scp -i <your-key.pem> -r . ec2-user@<EC2PublicIP>:/var/www/logo-detection
```

- SSH into your EC2 instance:

```bash
ssh -i <your-key.pem> ec2-user@<EC2PublicIP>
```

- On the EC2 instance:

```bash
cd /var/www/logo-detection
npm install
npm start
```

### 6. Access the Application

Open your browser and visit:

```text
http://<EC2PublicIP>:3000
```

---

## Usage

- **Upload Images**: Upload JPEG or PNG files through the web interface.
- **View Results**: See detected logos with bounding boxes and confidence scores.
- **Explore History**: Review previously uploaded images and their detection results.
- **Receive Notifications**: Get email alerts for every successful logo detection.

---

## Why LogoPulse?

LogoPulse showcases the potential of combining AWS AI capabilities with scalable cloud-native architecture.  
It demonstrates how to integrate serverless services securely and deliver a seamless user experience—making it an ideal project for learning, showcasing technical skills, or even adapting for real-world applications.

---

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m "Add your feature"`).
4. Push to your branch (`git push origin feature/your-feature`).
5. Open a pull request.



