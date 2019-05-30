# AWS CLI describe-* -> Cloud formation
Convert AWS cli describe to cloud formation
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
