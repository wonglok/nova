import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cfOrigins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

// let ugc = new DistributionForBucket(stack, "UGC", {});
//

export interface DistributionForBucket {
  bucket: s3.Bucket;
  distribution: cloudfront.Distribution;
  envInfo: {
    ugcBucketName: string;
    ugcCdnDomain: string;
    ugcBucketDomain: string;
  };
}

export class DistributionForBucket extends Construct {
  constructor(scope: any, id: any, props: any) {
    super(scope, id);
    this.bucket = new s3.Bucket(this, "DataBucket", {
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.HEAD,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ["*"],
        },
      ],
    });

    this.distribution = new cloudfront.Distribution(this, "DataDistribution", {
      defaultBehavior: {
        origin: new cfOrigins.S3Origin(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
      },
    });

    this.envInfo = {
      ugcBucketName: this.bucket.bucketName,
      ugcCdnDomain: this.distribution.domainName,
      ugcBucketDomain: this.bucket.bucketDomainName,
    };
  }
}
