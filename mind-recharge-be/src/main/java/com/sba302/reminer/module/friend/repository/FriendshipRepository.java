package com.sba302.reminer.module.friend.repository;

import com.sba302.reminer.module.friend.entity.Friendship;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long>,
        JpaSpecificationExecutor<Friendship> {

    Optional<Friendship> findByUserOneIdAndUserTwoId(Long userOneId, Long userTwoId);
}
