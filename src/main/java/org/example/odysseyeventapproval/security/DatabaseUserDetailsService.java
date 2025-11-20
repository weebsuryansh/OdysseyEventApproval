package org.example.odysseyeventapproval.security;

import org.example.odysseyeventapproval.model.PasswordCredential;
import org.example.odysseyeventapproval.model.User;
import org.example.odysseyeventapproval.repository.PasswordRepository;
import org.example.odysseyeventapproval.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DatabaseUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;
    private final PasswordRepository passwordRepository;

    public DatabaseUserDetailsService(UserRepository userRepository, PasswordRepository passwordRepository) {
        this.userRepository = userRepository;
        this.passwordRepository = passwordRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        PasswordCredential credential = passwordRepository.findByUser(user)
                .orElseThrow(() -> new UsernameNotFoundException("Password missing"));
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                credential.getPasswordHash(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}
