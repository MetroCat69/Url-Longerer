## The topic of the development lifecycle

1. I don't want to directly deploy to aws becouse this is a very bad habit
1. Also I can't afford to waist money
1. Tried sam+ dynamo in docker and had hell and over enginriring trying to make lambdaas write to the docker dynamo
1. also I am using cdk so it was suck a pain to make everything
1. tried deploying the dynamo and running lambda locally and lost money and had to do a lot of configiration and stuff still didn't work
1. cant just deploy every time due to pain+money
1. I am going to choose local stack seems like it will enable me to do stuff locally without spending days doing configiration
1. I tried local stack and its great
1. however hard as I tried couldn't suc in running localstack+sam due to a wierd aws authantication problem
1. also coudn't manage to debug locally
1. so then I am going to run shit on local stack(locally) and debug with logs

## so ...

1. To challenge myself every infra stuff most be infra as code

1. Tried working directly on aws but i found debbuging very difficult
1. I tried running using aws +sam but I forgot somre resource open and lost a lot of money (ec2 :( ))
1. So I tried using docker for dynamo+ sam for lambda but found that I need to pass paramas and boot stuff in a very convolted way to perfectly sync docker stuff with aws cdk stuff without hard coding it
1. So I tried aws sam with local stack and it defently didnt work
1. So I tried just local stack really hard and after a ton of configiration and learning and docker composing I also tried and fialed to use it with sam local but the final straw was that I cant have the same domain for testing rather I have a new domain every time for the api gateway
1. I learned that local stack is a lot of work with crazy problems like sub networks problems docker compose configirations and authantication wierdness
1. I am not a devops so I am willing to pay to just host mys stuff on aws
1. main problem I need to solve is to create two deployments one for lambda one for infra this is why I didn't want to do this shit intially
1. make this a hige mono repo for debugging lambda or maybe I should just use the ui and see logs
1. to same time and effort from making a huge mono repo I will just debug lambdas with logs
