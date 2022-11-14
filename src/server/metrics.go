package main

import (
	"context"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch/types"
)

func incrementAPIMetric(apiName, apiType string) {
	_, err := env.AWSCWClient.PutMetricData(context.TODO(), &cloudwatch.PutMetricDataInput{
		Namespace: aws.String(metricNamespace),
		MetricData: []types.MetricDatum{
			{
				MetricName: aws.String("ApiCounter"),
				Timestamp:  aws.Time(time.Now()),
				Unit:       types.StandardUnitCount,
				Value:      aws.Float64(1),
				Dimensions: []types.Dimension{
					{
						Name:  aws.String("api_name"),
						Value: aws.String(apiName),
					},
					{
						Name:  aws.String("api_type"),
						Value: aws.String(apiType),
					},
				},
			},
		},
	})
	if err != nil {
		log.Errorf("Error adding metrics: %v", err)
	}
}
