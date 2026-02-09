package com.calm.admin.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Configuration
public class AwsConfig {

    private static final Logger log = LoggerFactory.getLogger(AwsConfig.class);

    @Value("${aws.s3.metadata.accessKeyId:}")
    private String metadataAccessKeyId;

    @Value("${aws.s3.metadata.secretAccessKey:}")
    private String metadataSecretKey;

    @Value("${aws.s3.metadata.region:us-east-1}")
    private String metadataRegion;

    @Value("${aws.s3.transcriptions.accessKeyId:}")
    private String transcriptionsAccessKeyId;

    @Value("${aws.s3.transcriptions.secretAccessKey:}")
    private String transcriptionsSecretKey;

    @Value("${aws.s3.transcriptions.region:us-east-1}")
    private String transcriptionsRegion;

    @Bean(name = "metadataS3Client")
    public S3Client metadataS3Client() {
        if (metadataAccessKeyId == null || metadataAccessKeyId.isBlank() ||
            metadataSecretKey == null || metadataSecretKey.isBlank()) {
            log.warn("AWS metadata S3 credentials not configured. S3 sync will be disabled.");
            return null;
        }
        AwsBasicCredentials credentials = AwsBasicCredentials.create(metadataAccessKeyId, metadataSecretKey);
        return S3Client.builder()
                .region(Region.of(metadataRegion))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .build();
    }

    @Bean(name = "transcriptionsS3Client")
    public S3Client transcriptionsS3Client() {
        if (transcriptionsAccessKeyId == null || transcriptionsAccessKeyId.isBlank() ||
            transcriptionsSecretKey == null || transcriptionsSecretKey.isBlank()) {
            log.warn("AWS transcriptions S3 credentials not configured. S3 sync will be disabled.");
            return null;
        }
        AwsBasicCredentials credentials = AwsBasicCredentials.create(transcriptionsAccessKeyId, transcriptionsSecretKey);
        return S3Client.builder()
                .region(Region.of(transcriptionsRegion))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .build();
    }
    
    @Bean(name = "transcriptionsS3Presigner")
    public S3Presigner transcriptionsS3Presigner() {
        if (transcriptionsAccessKeyId == null || transcriptionsAccessKeyId.isBlank() ||
            transcriptionsSecretKey == null || transcriptionsSecretKey.isBlank()) {
            log.warn("AWS transcriptions S3 credentials not configured. Presigner will be disabled.");
            return null;
        }
        AwsBasicCredentials credentials = AwsBasicCredentials.create(transcriptionsAccessKeyId, transcriptionsSecretKey);
        return S3Presigner.builder()
                .region(Region.of(transcriptionsRegion))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .build();
    }
}

