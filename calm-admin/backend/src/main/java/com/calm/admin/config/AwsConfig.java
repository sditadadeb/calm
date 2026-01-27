package com.calm.admin.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
public class AwsConfig {

    @Value("${aws.s3.metadata.accessKeyId}")
    private String metadataAccessKeyId;

    @Value("${aws.s3.metadata.secretAccessKey}")
    private String metadataSecretKey;

    @Value("${aws.s3.metadata.region}")
    private String metadataRegion;

    @Value("${aws.s3.transcriptions.accessKeyId}")
    private String transcriptionsAccessKeyId;

    @Value("${aws.s3.transcriptions.secretAccessKey}")
    private String transcriptionsSecretKey;

    @Value("${aws.s3.transcriptions.region}")
    private String transcriptionsRegion;

    @Bean(name = "metadataS3Client")
    public S3Client metadataS3Client() {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(metadataAccessKeyId, metadataSecretKey);
        return S3Client.builder()
                .region(Region.of(metadataRegion))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .build();
    }

    @Bean(name = "transcriptionsS3Client")
    public S3Client transcriptionsS3Client() {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(transcriptionsAccessKeyId, transcriptionsSecretKey);
        return S3Client.builder()
                .region(Region.of(transcriptionsRegion))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .build();
    }
}

