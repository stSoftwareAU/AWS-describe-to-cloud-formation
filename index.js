exports.handler = async (event) => {

  console.info(JSON.stringify(event,null,2));

  let resourses = {};

  let responseBody = {
    "AWSTemplateFormatVersion": "2010-09-09",
    "Resources": resourses
  };

  let ltv = event['LaunchTemplateVersions'];

  if (ltv) {

    let len = ltv.length;
    for (let i = 0; i < len; i++) {
      launchTemplateVersions(resourses, ltv[i]);
    }

  }
  let lsg = event['SecurityGroups'];
  if (lsg) {
    let len = lsg.length;
    for (let i = 0; i < len; i++) {
      securityGroup(resourses, lsg[i]);
    }
  }

  let las = event['AutoScalingGroups'];
  if (las) {
    let len = las.length;
    for (let i = 0; i < len; i++) {
      autoScaleGroup(resourses, las[i]);
    }
  }


  let vpcs = event['Vpcs'];
  if (vpcs) {
    let len = vpcs.length;
    for (let i = 0; i < len; i++) {
      virtualPrivateCloud(resourses, vpcs[i]);
    }
  }

  let subnets = event['Subnets'];
  if (subnets) {
    subnets.forEach( e => subnet(resourses, e));
  }

  let listeners = event['Listeners'];
  if (listeners) {
    listeners.forEach( e => listener(resourses, e));
  }
    
  let targetGroups = event['TargetGroups'];
  if (targetGroups) {
    targetGroups.forEach( e => targetGroup(resourses, e));
  }
  
  let tmpUserPool = event['UserPool'];
  if (tmpUserPool) {
     userPool(resourses, tmpUserPool);
  }
  
  let tmpTable = event['Table'];
  if (tmpTable) {
     dynamodbTable(resourses, tmpTable);
  }
  
  if( event.stateMachineArn){
    stateMachine(resourses, event);
  }
  
  if( event.Distribution)
  {
    cloudFrontDistribution( resourses, event.Distribution);
  }
  let responseCode = 200;

  let response = {
    statusCode: responseCode,

    //        body: JSON.stringify(responseBody)
    body: responseBody
  };
  console.log("response: " + JSON.stringify(response,null,2));
  return response;
};

function safeName(name) {

  let tmpName = name.replace(/[^a-zA-Z0-9]/g, " ");
  tmpName = tmpName
    .split(' ')
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
    .join('');

  return tmpName;
}

function b64Value(b64) {

  let buff = new Buffer(b64, 'base64');
  let text = buff.toString('ascii');

  let joinObj = {
    "Fn::Join": ["\n", text.split('\n')]
  };

  let obj = {
    "Fn::Base64": joinObj
  };

  return obj;
}


function launchTemplateVersions(resources, ltv) {

  if (ltv.DefaultVersion) {

    let item = {};
    item.Type = "AWS::EC2::LaunchTemplate";
    item.Properties = {};
    item.Properties.LaunchTemplateName = ltv.LaunchTemplateName;

    item.Properties.LaunchTemplateData = ltv.LaunchTemplateData;
    item.Properties.LaunchTemplateData.UserData = b64Value(ltv.LaunchTemplateData.UserData);

    resources['LaunchTemplate' + safeName(ltv.LaunchTemplateName)] = item;
  }
}

let sgCount = 0;

function securityGroup(resources, sg) {

  let sgName = "sg" + sgCount++;

  let item = {};
  item.Type = "AWS::EC2::SecurityGroup";
  item.Properties = {};

  if (sg.GroupName) {
    sgName = sg.GroupName;
    item.Properties.GroupName = sg.GroupName;
  }
  if (sg.Description) {
    item.Properties.GroupDescription = sg.Description;
  }

  item.Properties.VpcId = sg.VpcId;
  if (sg.IpPermissions) {
    let len = sg.IpPermissions.length;
    let arr = [];
    item.Properties.SecurityGroupIngress = arr;
    for (let i = 0; i < len; i++) {
      let ipPermission = sg.IpPermissions[i];

      let rangeCount = ipPermission.IpRanges.length;

      for (let r = 0; r < rangeCount; r++) {
        let ipRange = ipPermission.IpRanges[r];

        let item = {};
        item.IpProtocol = ipPermission.IpProtocol;
        item.FromPort = ipPermission.FromPort;
        item.ToPort = ipPermission.ToPort;
        item.CidrIp = ipRange.CidrIp;
        item.Description = ipRange.Description;
        arr.push(item);
      }

      let userCount = ipPermission.UserIdGroupPairs.length;

      for (let u = 0; u < userCount; u++) {
        let userIdGroupPair = ipPermission.UserIdGroupPairs[u];

        let item = {};
        item.IpProtocol = ipPermission.IpProtocol;
        item.FromPort = ipPermission.FromPort;
        item.ToPort = ipPermission.ToPort;
        item.SourceSecurityGroupId = userIdGroupPair.GroupId;
        item.Description = userIdGroupPair.Description;
        arr.push(item);
      }
    }

  }

  if (sg.IpPermissionsEgress) {
    let len = sg.IpPermissionsEgress.length;
    let arr = [];
    item.Properties.SecurityGroupEgress = arr;
    for (let i = 0; i < len; i++) {
      let ipPermission = sg.IpPermissionsEgress[i];

      let rangeCount = ipPermission.IpRanges.length;

      for (let r = 0; r < rangeCount; r++) {
        let ipRange = ipPermission.IpRanges[r];

        let tmp = {};
        tmp.IpProtocol = ipPermission.IpProtocol;
        tmp.FromPort = ipPermission.FromPort;
        tmp.ToPort = ipPermission.ToPort;
        tmp.CidrIp = ipRange.CidrIp;
        tmp.Description = ipRange.Description;
        arr.push(tmp);
      }

      let userCount = ipPermission.UserIdGroupPairs.length;

      for (let u = 0; u < userCount; u++) {
        let userIdGroupPair = ipPermission.UserIdGroupPairs[u];

        let item = {};
        item.IpProtocol = ipPermission.IpProtocol;
        item.FromPort = ipPermission.FromPort;
        item.ToPort = ipPermission.ToPort;
        item.SourceSecurityGroupId = userIdGroupPair.GroupId;
        item.Description = userIdGroupPair.Description;
        arr.push(item);
      }
    }
  }

  copyTags(sg, item.Properties);

  resources['securityGroup' + safeName(sgName)] = item;
}

function copyTags(from, to) {
  if (from.Tags) {
    to.Tags = from.Tags.filter(item => !item.Key.startsWith("aws:cloudformation:"));
  }

}


function autoScaleGroup(resources, e) {

  let resource = {};
  resource.Type = "AWS::AutoScaling::AutoScalingGroup";
  let p = JSON.parse(JSON.stringify(e));
  resource.Properties = p;

  p.MixedInstancesPolicy.InstancesDistribution=p.InstancesDistribution;
  //delete p['InstancesDistribution'];

  const removeItems = ["Tags", "AutoScalingGroupARN", "TargetGroupARNs", "SuspendedProcesses", "EnabledMetrics", "DefaultCooldown", "Instances", "CreatedTime", "NewInstancesProtectedFromScaleIn"];
  removeItems.forEach(key => delete p[key]);

  p.Cooldown = e.DefaultCooldown;

  copyTags(e, p);

  resources['autoScalingGroup' + safeName(e.AutoScalingGroupName)] = resource;
}

function makeNameFromTags(e, defaultName) {
  let name = "";
  if (e.Tags) {
    let len = e.Tags.length;
    for (let i = 0; i < len; i++) {
      let tag = e.Tags[i];

      if (tag.Key == "Name") {
        name = tag.Value;
        break;
      }
    }
  }

  if (!name) {
    name = defaultName;
  }
  return name;
}

let vpcCount = 0;

function virtualPrivateCloud(resources, e) {

  vpcCount++;
  let name = makeNameFromTags(e, "" + vpcCount);

  let resource = {};
  resource.Type = "AWS::EC2::VPC";
  let p = {};
  resource.Properties = p;

  p.CidrBlock = e.CidrBlock;
  p.InstanceTenancy = e.InstanceTenancy;
  copyTags(e, p);

  resources['vpc' + safeName(name)] = resource;
}

let subnetCount = 0;

function subnet(resources, e) {
  subnetCount++;
  let name = makeNameFromTags(e, "" + subnetCount);
  let resource = {};
  resource.Type = "AWS::EC2::Subnet";

  let p = JSON.parse(JSON.stringify(e));
  resource.Properties = p;

  const removeItems = [
    "Tags",
    "AvailabilityZoneId",
    "AvailableIpAddressCount",
    "DefaultForAz",
    "State",
    "SubnetId",
    "OwnerId",
    "Ipv6CidrBlockAssociationSet",
    "SubnetArn"
  ];
  removeItems.forEach(key => delete p[key]);

  copyTags(e, p);

  resources['subnet' + safeName(name)] = resource;
}

function listener(resources, e) {
  let resource = {};
  resource.Type = "AWS::ElasticLoadBalancingV2::Listener";

  let p = JSON.parse(JSON.stringify(e));
  resource.Properties = p;

  const removeItems = [
    "ListenerArn"
  ];
  removeItems.forEach(key => delete p[key]);
  
  let match = e.LoadBalancerArn.match( /.*\/([a-zA-Z0-9]+)\/[a-z0-9A-Z]+/);
  let name=match[1] + e.Port;
  resources['listener' + safeName(name)] = resource;
}



function targetGroup(resources, e) {
  let resource = {};
  resource.Type = "AWS::ElasticLoadBalancingV2::TargetGroup";

  let p = JSON.parse(JSON.stringify(e));
  resource.Properties = p;
  p.Name=e.TargetGroupName;
  
  const removeItems = [
    "ListenerArn",
    "TargetGroupName",
    
  ];
  removeItems.forEach(key => delete p[key]);
  
  copyTags(e, p);
  
  resources['targetGroup' + safeName(p.Name)] = resource;
}


function userPool(resources, e) {
  let resource = {};
  resource.Type = "AWS::Cognito::UserPool";

  let p = JSON.parse(JSON.stringify(e));
  resource.Properties = p;
  p.UserPoolName=e.Name;
  p.Schema=e.SchemaAttributes.filter( item => item.Name != "phone_number_verified");
  p.Schema=p.Schema.map( item => {
    let tmp=Object.assign( {}, item);
    
    if( tmp.Name.startsWith( "custom:")){
      tmp.Name=tmp.Name.substring( 7);
    }
    return tmp;});
  // p.AdminCreateUserConfig.UnusedAccountValidityDays=p.AdminCreateUserConfig.UnusedAccountValidityDays;
  delete p.AdminCreateUserConfig["UnusedAccountValidityDays"];
  const removeItems = [
    "Id",
    "Name",
    "LastModifiedDate",
    "CreationDate",
    "SchemaAttributes",
    "EstimatedNumberOfUsers",
    "Arn",
    "VerificationMessageTemplate"
  ];
  removeItems.forEach(key => delete p[key]);
  
  copyTags(e, p);
  
  resources['userPool' + safeName(p.UserPoolName)] = resource;
}


function fixProvisionedThroughput( item)
{
  delete item.ProvisionedThroughput["NumberOfDecreasesToday"];
  
  if( item.ProvisionedThroughput.ReadCapacityUnits==0 && item.ProvisionedThroughput.WriteCapacityUnits==0 )
  {
    delete item["ProvisionedThroughput"];
  }
}

function dynamodbTable(resources, e) {
  let resource = {};
  resource.Type = "AWS::DynamoDB::Table";

  let p = JSON.parse(JSON.stringify(e));
  resource.Properties = p;

  if( p.ProvisionedThroughput)
  {
    fixProvisionedThroughput( p);
  }
  
  if( p.BillingModeSummary.BillingMode)
  {
    p.BillingMode=p.BillingModeSummary.BillingMode;
  }
  
  const removeItems = [
    "TableStatus",
    "CreationDateTime",
    "TableSizeBytes",
    "ItemCount",
    "TableArn",
    "TableId",
    "BillingModeSummary"
  ];
  removeItems.forEach(key => delete p[key]);
  
  const removeIndexItems=[
    "IndexStatus",
    "IndexSizeBytes",
    "ItemCount",
    "IndexArn"
  ];
  if( p.GlobalSecondaryIndexes)
  {
    p.GlobalSecondaryIndexes.forEach( item => {
        removeIndexItems.forEach(key => delete item[key]);
        fixProvisionedThroughput( item);
      }
    );
  }
  
  if( p.LocalSecondaryIndexes)
  {
    p.LocalSecondaryIndexes.forEach( item => {
        removeIndexItems.forEach(key => delete item[key]);
        fixProvisionedThroughput( item);
      }
    );
  }
  
  removeItems.forEach(key => delete p[key]);
  copyTags(e, p);
  
  resources['table' + safeName(p.TableName)] = resource;
}

function stateMachine(resources, e) {
  let resource = {};
  resource.Type = "AWS::StepFunctions::StateMachine";

  let p = JSON.parse(JSON.stringify(e));
  resource.Properties = p;
  let a = p.definition.split("\n");
  p.DefinitionString={
      "Fn::Join": [
      "\\n",
      a
      ]
  };
  p.StateMachineName=p.name;
  p.RoleArn=p.roleArn;
  const removeItems = [
    "stateMachineArn",
    "creationDate",
    "status",
    "roleArn",
    "name",
    "definition"
  ];
  removeItems.forEach(key => delete p[key]);
  
  copyTags(e, p);
  
  resources['stateMachine' + safeName(p.StateMachineName)] = resource;
}

function cloudFrontDistribution(resources, e) {
  let resource = {};
  resource.Type = "AWS::CloudFront::Distribution";

  let p = JSON.parse(JSON.stringify(e));
  resource.Properties = p;

  const removeItems = [
    "Id",
    "ARN",
    "Status",
    "LastModifiedTime",
    "InProgressInvalidationBatches",
    "AliasICPRecordals",
    "ActiveTrustedSigners",
    "DomainName"
  ];
  removeItems.forEach(key => delete p[key]);

  if( p.DistributionConfig)
  {
    const removeDistributionConfigItems=[
      "OriginGroups",
      "IsIPV6Enabled",
      "CallerReference"
    ];
    
    removeDistributionConfigItems.forEach(key => delete p.DistributionConfig[key]);
  }
  
  if( p.DistributionConfig && p.DistributionConfig.Logging)
  {
    if( ! p.DistributionConfig.Logging.Enabled)
    {
      delete p.DistributionConfig.Logging;
    }
    else
    {
      delete p.DistributionConfig.Logging.Enabled;
    }
  }
  
  let vc=p.DistributionConfig.ViewerCertificate;
  // console.log( "VC:", vc);
  if( vc)
  {
    vc.AcmCertificateArn=vc.ACMCertificateArn;
    delete vc.ACMCertificateArn;
    vc.SslSupportMethod=vc.SSLSupportMethod;
    delete vc.SSLSupportMethod;
    delete vc.Certificate;
    delete vc.CertificateSource;
  }
  let items=p.DistributionConfig.Origins.Items;
  
  items.forEach( item => {delete item.CustomHeaders});
  p.DistributionConfig.Origins=items;
  if(p.DistributionConfig.DefaultCacheBehavior)
  {
    let dcb=p.DistributionConfig.DefaultCacheBehavior;
    if(dcb.LambdaFunctionAssociations )
    {
      items=dcb.LambdaFunctionAssociations.Items;
      
      if( items )
      {
        dcb.LambdaFunctionAssociations=items;
      }
      else
      {
        delete dcb.LambdaFunctionAssociations;
      }
    }
    
    if( dcb.TrustedSigners)
    {
      items=dcb.TrustedSigners.Items;
      
      if( items )
      {
        dcb.TrustedSigners=items;
      }
      else
      {
        delete dcb.TrustedSigners;
      }
    }
    
    if( dcb.AllowedMethods)
    {
      items=dcb.AllowedMethods.Items;
      
      if( items )
      {
        dcb.AllowedMethods=items;
      }
      else
      {
        delete dcb.AllowedMethods;
      }
    }
    
    if( dcb.ForwardedValues)
    {
      let fv=dcb.ForwardedValues;
      
      if( fv.Headers)
      {
        items=fv.Headers.Items;
        if( items )
        {
          fv.Headers=items;
        }
        else
        {
          delete fv.Headers;
        }
      }
      if( fv.QueryStringCacheKeys)
      {
        items=fv.QueryStringCacheKeys.Items;
        if( items )
        {
          fv.QueryStringCacheKeys=items;
        }
        else
        {
          delete fv.QueryStringCacheKeys;
        }
      }
    }
  }
  if(Array.isArray(p.DistributionConfig.Origins))
  {
    p.DistributionConfig.Origins.forEach( origin => {
      if( origin.CustomOriginConfig)
      {
        if( origin.CustomOriginConfig.OriginSslProtocols)
        {
          let item=origin.CustomOriginConfig.OriginSslProtocols.Items;
          
          if( item)
          {
            origin.CustomOriginConfig.OriginSSLProtocols=item;
          }
          
          delete origin.CustomOriginConfig.OriginSslProtocols;
        }
      }
    });
  }
  if(Array.isArray(p.DistributionConfig.CacheBehaviors))
  {
    p.DistributionConfig.CacheBehaviors.forEach( cb => {
      
      if( cb.ForwardedValues){
        console.log( cb.ForwardedValues);
        let fv=cb.ForwardedValues;
        if(fv.Headers )
        {
          items=fv.Headers.Items;
          
          if( items )
          {
            fv.Headers=items;
          }
          else
          {
            delete fv.Headers;
          }
        }
        
        if( fv.QueryStringCacheKeys)
        {
          items=fv.QueryStringCacheKeys.Items;
          
          if( items )
          {
            fv.QueryStringCacheKeys=items;
          }
          else
          {
            delete fv.QueryStringCacheKeys;
          }
        }
      }
          
      if( cb.TrustedSigners)
      {
        items=cb.TrustedSigners.Items;
        
        if( items )
        {
          cb.TrustedSigners=items;
        }
        else
        {
          delete cb.TrustedSigners;
        }
      }
      
      if( cb.AllowedMethods)
      {
        if( cb.AllowedMethods.CachedMethods)
        {
          items=cb.AllowedMethods.CachedMethods.Items;
          if( items)
          {
            cb.CachedMethods=items;
          }
        }
        items=cb.AllowedMethods.Items;
        
        if( items )
        {
          cb.AllowedMethods=items;
        }
        else
        {
          delete cb.AllowedMethods;
        }
      }
      
      if( cb.LambdaFunctionAssociations)
      {
        let items=cb.LambdaFunctionAssociations.Items;
        
        if( items)
        {
          cb.LambdaFunctionAssociations=items;
  
        }
  
      }
    });
  }
  if( p.DistributionConfig.CustomErrorResponses)
  {
    let items = p.DistributionConfig.CustomErrorResponses.Items;
    if( items)
    {
      p.DistributionConfig.CustomErrorResponses=items;
    }
    else
    {
      delete p.DistributionConfig.CustomErrorResponses;
    }
  }
   
  if( p.DistributionConfig.Aliases)
  {
    let items = p.DistributionConfig.Aliases.Items;
    if( items)
    {
      p.DistributionConfig.Aliases=items;
    }
    else
    {
      delete p.DistributionConfig.Aliases;
    }
  }
  
  if( p.DistributionConfig.CacheBehaviors)
  {
    let items = p.DistributionConfig.CacheBehaviors.Items;
    if( items)
    {
      p.DistributionConfig.CacheBehaviors=items;
    }
    else
    {
      delete p.DistributionConfig.CacheBehaviors;
    }
  }
  
  if( p.DistributionConfig.Restrictions && p.DistributionConfig.Restrictions.GeoRestriction )
  {
    let gr=p.DistributionConfig.Restrictions.GeoRestriction;
    delete gr.Quantity;
    let items=gr.Items;
    if( items)
    {
      gr.Locations=items;
      delete gr.Items;
    }
  }
  copyTags(e, p); 
  
  resources['Distribution' + safeName("")] = resource;
}
