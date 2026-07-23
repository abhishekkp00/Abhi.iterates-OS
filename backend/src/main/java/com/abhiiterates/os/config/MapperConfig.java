package com.abhiiterates.os.config;

import com.abhiiterates.os.user.UserMapper;
import org.mapstruct.factory.Mappers;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MapperConfig exposes MapStruct mappers as Spring beans.
 * This guarantees loading even under DevTools restart/caching anomalies.
 */
@Configuration
public class MapperConfig {

    @Bean
    public UserMapper userMapper() {
        return Mappers.getMapper(UserMapper.class);
    }
}
