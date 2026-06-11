package com.bancooccidente.admin.dto;

/**
 * Referencia a una grabación en S3 (layout occidente-grabaciones).
 */
public record S3RecordingRef(String recordingId, String s3BaseKey) {}
