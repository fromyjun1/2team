package com.club.part4.service;

import com.club.part1.repository.UserRepository;
import com.club.part2.repository.ClubRepository;
import com.club.part4.model.MemberPost;
import com.club.part4.repository.ApplicationRepository;
import com.club.part4.repository.MemberPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MemberPostService {

    private final MemberPostRepository memberPostRepository;
    private final ClubRepository clubRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;

    private void checkMember(Long clubId, Long userId) {
        boolean isCreator = clubRepository.findById(clubId)
            .map(c -> c.getCreatorId().equals(userId))
            .orElse(false);
        boolean isMember = applicationRepository
            .findByUserIdAndClubId(userId, clubId)
            .map(a -> "APPROVED".equals(a.getStatus()))
            .orElse(false);
        if (!isCreator && !isMember) throw new SecurityException("멤버만 이용할 수 있습니다.");
    }

    public List<MemberPost> getList(Long clubId, Long requestUserId) {
        checkMember(clubId, requestUserId);
        List<MemberPost> all = memberPostRepository.findByClubIdOrderByCreatedAtDesc(clubId);
        List<MemberPost> posts = all.stream()
            .filter(p -> p.getParentId() == null)
            .collect(Collectors.toList());
        posts.forEach(p -> p.setReplies(
            all.stream().filter(r -> p.getPostId().equals(r.getParentId())).collect(Collectors.toList())
        ));

        Set<Long> authorIds = all.stream().map(MemberPost::getAuthorId).collect(Collectors.toSet());
        Map<Long, String> nameMap = userRepository.findAllById(authorIds).stream()
            .collect(Collectors.toMap(u -> u.getUserId(), u -> u.getUserName()));

        posts.forEach(p -> {
            p.setAuthorName(nameMap.getOrDefault(p.getAuthorId(), "알 수 없음"));
            p.getReplies().forEach(r -> r.setAuthorName(nameMap.getOrDefault(r.getAuthorId(), "알 수 없음")));
        });
        return posts;
    }

    @Transactional
    public MemberPost createPost(Long clubId, Long authorId, String title, String content) {
        checkMember(clubId, authorId);
        MemberPost post = new MemberPost();
        post.setClubId(clubId);
        post.setAuthorId(authorId);
        post.setTitle(title);
        post.setContent(content);
        return memberPostRepository.save(post);
    }

    @Transactional
    public MemberPost createReply(Long parentId, Long authorId, String content) {
        MemberPost parent = memberPostRepository.findById(parentId)
            .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        checkMember(parent.getClubId(), authorId);
        MemberPost reply = new MemberPost();
        reply.setClubId(parent.getClubId());
        reply.setAuthorId(authorId);
        reply.setParentId(parentId);
        reply.setContent(content);
        return memberPostRepository.save(reply);
    }

    @Transactional
    public void delete(Long postId, Long requestUserId) {
        MemberPost post = memberPostRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        boolean isAuthor = post.getAuthorId().equals(requestUserId);
        boolean isCreator = clubRepository.findById(post.getClubId())
            .map(c -> c.getCreatorId().equals(requestUserId)).orElse(false);
        boolean isAdmin = userRepository.findById(requestUserId)
            .map(u -> "ADMIN".equals(u.getRole())).orElse(false);
        if (!isAuthor && !isCreator && !isAdmin) throw new SecurityException("권한이 없습니다.");
        if (post.getParentId() == null) {
            memberPostRepository.deleteAll(memberPostRepository.findByParentId(postId));
        }
        memberPostRepository.delete(post);
    }
}
