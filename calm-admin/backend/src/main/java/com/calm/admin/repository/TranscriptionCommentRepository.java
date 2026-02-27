package com.calm.admin.repository;

import com.calm.admin.model.TranscriptionComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TranscriptionCommentRepository extends JpaRepository<TranscriptionComment, Long> {
    List<TranscriptionComment> findByRecordingIdOrderByCreatedAtAsc(String recordingId);
}
