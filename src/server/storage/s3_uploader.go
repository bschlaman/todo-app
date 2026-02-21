package storage

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3UploadMeta struct {
	StorageKey string
	PublicURL  string
}

type S3Uploader struct {
	client    *s3.Client
	bucket    string
	keyPrefix string
	timeout   time.Duration
}

func NewS3Uploader(client *s3.Client, bucket, keyPrefix string, timeout time.Duration) (*S3Uploader, error) {
	if timeout <= 0 {
		return nil, errors.New("s3 upload timeout must be greater than zero")
	}
	if strings.TrimSpace(bucket) == "" || strings.ContainsAny(bucket, " \t\n\r") {
		return nil, fmt.Errorf("invalid s3 bucket name: %q", bucket)
	}

	return &S3Uploader{
		client:    client,
		bucket:    bucket,
		keyPrefix: strings.Trim(keyPrefix, "/"),
		timeout:   timeout,
	}, nil
}

func (u *S3Uploader) Upload(ctx context.Context, key, mimeType string, data []byte) (S3UploadMeta, error) {
	if u == nil || u.client == nil {
		return S3UploadMeta{}, errors.New("s3 uploader is not configured")
	}
	if u.keyPrefix != "" {
		key = u.keyPrefix + "/" + key
	}

	uri := fmt.Sprintf("s3://%s/%s", u.bucket, key)

	if ctx == nil {
		ctx = context.Background()
	}
	ctx, cancel := context.WithTimeout(ctx, u.timeout)
	defer cancel()

	_, err := u.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      &u.bucket,
		Key:         &key,
		Body:        bytes.NewReader(data),
		ContentType: &mimeType,
	})
	if err != nil {
		return S3UploadMeta{}, fmt.Errorf("put object to %s: %w", uri, err)
	}

	return S3UploadMeta{
		StorageKey: key,
		PublicURL:  uri,
	}, nil
}
