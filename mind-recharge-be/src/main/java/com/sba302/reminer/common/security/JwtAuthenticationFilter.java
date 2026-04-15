package com.sba302.reminer.common.security;

import com.sba302.reminer.module.user.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String token = extractToken(request);

        if (StringUtils.hasText(token)) {
            try {
                Claims claims = jwtTokenProvider.parseToken(token);
                Long userId = Long.parseLong(claims.getSubject());
                String email = claims.get("email", String.class);
                String roleName = claims.get("role", String.class);

                if (StringUtils.hasText(email) && StringUtils.hasText(roleName)) {
                    setAuthentication(request, userId, email, roleName);
                } else {
                    // Backward compatibility for tokens issued before role/email claims were added.
                    userRepository.findById(userId).ifPresent(user ->
                            setAuthentication(request, user.getId(), user.getEmail(), user.getRole().getRoleName()));
                }
            } catch (RuntimeException ex) {
                log.warn("JWT authentication skipped: {}", ex.getClass().getSimpleName());
            }
        }

        chain.doFilter(request, response);
    }

    private void setAuthentication(HttpServletRequest request, Long userId, String email, String roleName) {
        CustomUserPrincipal principal = new CustomUserPrincipal(userId, email, roleName);
        var auth = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + roleName))
        );
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private String extractToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
