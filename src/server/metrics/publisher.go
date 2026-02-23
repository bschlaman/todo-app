package metrics

import (
	"context"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch/types"
	"github.com/bschlaman/b-utils/pkg/logger"
)

// Publisher publishes application metrics to CloudWatch.
type Publisher struct {
	client    *cloudwatch.Client
	namespace string
	log       *logger.BLogger
}

// NewPublisher creates a new metrics Publisher.
func NewPublisher(client *cloudwatch.Client, namespace string, log *logger.BLogger) *Publisher {
	return &Publisher{
		client:    client,
		namespace: namespace,
		log:       log,
	}
}

// IncrementAPIMetric publishes a count metric for the given API call.
func (p *Publisher) IncrementAPIMetric(apiName, apiType string) {
	_, err := p.client.PutMetricData(context.TODO(), &cloudwatch.PutMetricDataInput{
		Namespace: aws.String(p.namespace),
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
		p.log.Errorf("Metric put error: %v", err)
	}
}

// PutLatencyMetric publishes a latency metric for the given API call.
func (p *Publisher) PutLatencyMetric(latency time.Duration, apiName, apiType string) {
	_, err := p.client.PutMetricData(context.TODO(), &cloudwatch.PutMetricDataInput{
		Namespace: aws.String(p.namespace),
		MetricData: []types.MetricDatum{
			{
				MetricName: aws.String("ApiLatency"),
				Timestamp:  aws.Time(time.Now()),
				Unit:       types.StandardUnitMilliseconds,
				Value:      aws.Float64(float64(latency.Milliseconds())),
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
		p.log.Errorf("Metric put error: %v", err)
	}
}
