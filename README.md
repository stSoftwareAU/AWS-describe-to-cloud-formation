# AWS-cloud-formation-lambda
Convert AWS cli describe to cloud formation
```bash
sudo yum install jq

RESPONSE=`aws ec2 describe-launch-template-versions --launch-template-name test`
curl -X POST https://2d8ayd4x0e.execute-api.ap-southeast-2.amazonaws.com/test -d "$RESPONSE"|jq .body
```
