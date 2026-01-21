package com.numia.surveys.repository;

import com.numia.surveys.model.DistributionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DistributionLogRepository extends JpaRepository<DistributionLog, Long> {
    
    List<DistributionLog> findByDistributionId(Long distributionId);
    
    Optional<DistributionLog> findByDistributionIdAndContactId(Long distributionId, Long contactId);
    
    Optional<DistributionLog> findByExternalMessageId(String externalMessageId);
    
    @Query("SELECT COUNT(l) FROM DistributionLog l WHERE l.distribution.id = :distributionId AND l.sent = true")
    int countSentByDistributionId(Long distributionId);
    
    @Query("SELECT COUNT(l) FROM DistributionLog l WHERE l.distribution.id = :distributionId AND l.delivered = true")
    int countDeliveredByDistributionId(Long distributionId);
    
    @Query("SELECT COUNT(l) FROM DistributionLog l WHERE l.distribution.id = :distributionId AND l.opened = true")
    int countOpenedByDistributionId(Long distributionId);
    
    @Query("SELECT COUNT(l) FROM DistributionLog l WHERE l.distribution.id = :distributionId AND l.clicked = true")
    int countClickedByDistributionId(Long distributionId);
    
    @Query("SELECT COUNT(l) FROM DistributionLog l WHERE l.distribution.id = :distributionId AND l.bounced = true")
    int countBouncedByDistributionId(Long distributionId);
}

