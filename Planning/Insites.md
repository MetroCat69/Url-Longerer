## The Topic of the Development Lifecycle

1. I don't want to directly deploy to AWS because this is a very bad habit.
2. Also, I can't afford to waste money.
3. I tried SAM + DynamoDB in Docker and had a terrible experience with over-engineering while trying to make Lambdas write to the Docker DynamoDB. And integrating with aws CDK and I don't want to write a docker for every service.
4. Also, I am using CDK, so it was a huge pain to make everything work together.
5. I tried deploying DynamoDB and running Lambda locally, but I lost money and had to do a lot of configuration, and it still didn't work. I stopped becouse I lost money and I fear I will forgot it open.
6. I can't just deploy every time due to the hassle and cost.
7. I am going to choose LocalStack since it seems like it will enable me to do everything locally without spending days on configuration.
8. I tried LocalStack, and it's great.
9. However, no matter how hard I tried, I couldn't succeed in running LocalStack + SAM due to a weird AWS authentication problem.
10. Also, I couldn't manage to debug locally.
11. So, I am going to run everything on LocalStack (locally) and debug using logs.

## So ...

1. To challenge myself, every infrastructure component must be Infrastructure as Code.
2. I tried working directly on AWS, but I found debugging very difficult.
3. I tried running AWS + SAM, but I forgot some resources open and lost money .
4. So I tried using Docker for DynamoDB + SAM for Lambda but found that I needed to pass parameters and configure things in a very convoluted way to perfectly sync Docker with AWS CDK without hardcoding it.
5. I tried AWS SAM with LocalStack, and it definitely didn't work.
6. So I tried LocalStack really hard, and after a ton of configuration, learning, and Docker Compose setup, I also failed to use it with SAM local. The final straw was that I couldn't have the same domain for testing—every time, I got a new domain for API Gateway yet still due to networking shananigens I don't understand the lambdas would add random stuff to the domain name.
7. I learned that LocalStack requires a lot of work with crazy problems like subnet issues, Docker Compose configurations, and authentication weirdness.
8. I am not a DevOps engineer, so I am willing to pay to just host my stuff on AWS.
9. The main problem I need to solve is creating two separate deployments: one for Lambda and one for infrastructure. This is why I didn't want to do this initially.
10. I considered making this a huge monorepo for debugging Lambda, but maybe I should just use the UI and check logs instead.
11. To save time and effort from creating a huge monorepo, I will just debug Lambdas using logs.

# after trip update

I am givving up on cdk due to the hassle of either paying money or doing a lot of configiration work. From now on I will use express js with stuff I can just run on docker.
