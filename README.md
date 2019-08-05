# AWS CLI describe-* -> CloudFormation
Convert AWS cli describe output to a CloudFormation script 
```bash
sudo yum install jq

RESPONSE=`aws ec2 describe-launch-template-versions --launch-template-name test`
curl -X POST https://2d8ayd4x0e.execute-api.ap-southeast-2.amazonaws.com/test -d "$RESPONSE"|jq .body
```

## Supported commands
1. aws ec2 describe-launch-template-versions
2. aws autoscaling describe-auto-scaling-groups
3. aws ec2 describe-vpcs
4. aws ec2 describe-security-groups
5. aws ec2 describe-subnets
6. aws elbv2 describe-listeners
7. aws cognito-idp describe-user-pool --user-pool-id  ap-southeast-xxxxxxxxx
8. aws dynamodb describe-table --table-name test
9. aws stepfunctions  describe-state-machine --state-machine-arn arn:aws:states:ap-southeast-2:1234567890:stateMachine:xxxxxx
10. aws cloudfront get-distribution --id XXXXXX
