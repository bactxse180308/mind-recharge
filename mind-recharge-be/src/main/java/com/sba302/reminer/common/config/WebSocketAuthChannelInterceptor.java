package com.sba302.reminer.common.config;

import com.sba302.reminer.common.exception.AppException;
import com.sba302.reminer.common.security.CustomUserPrincipal;
import com.sba302.reminer.common.security.JwtTokenProvider;
import com.sba302.reminer.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() != StompCommand.CONNECT) {
            return message;
        }

        String authorization = firstNativeHeader(accessor, "Authorization");
        if (!StringUtils.hasText(authorization)) {
            authorization = firstNativeHeader(accessor, "authorization");
        }
        if (!StringUtils.hasText(authorization) || !authorization.startsWith("Bearer ")) {
            throw AppException.unauthorized("Missing WebSocket Authorization header");
        }

        String token = authorization.substring(7);
        if (!jwtTokenProvider.validateToken(token)) {
            throw AppException.unauthorized("Invalid WebSocket token");
        }

        Long userId = jwtTokenProvider.getUserId(token);
        var user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.unauthorized("User not found for WebSocket token"));

        CustomUserPrincipal principal = new CustomUserPrincipal(user.getId(), user.getEmail(), user.getRole().getRoleName());
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().getRoleName()))
        );
        accessor.setUser(authentication);
        return message;
    }

    private String firstNativeHeader(StompHeaderAccessor accessor, String headerName) {
        List<String> headers = accessor.getNativeHeader(headerName);
        if (headers == null || headers.isEmpty()) {
            return null;
        }
        return headers.get(0);
    }
}
