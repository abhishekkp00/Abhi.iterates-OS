package com.abhiiterates.os.user;

import com.abhiiterates.os.user.dto.UserProfileDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct Mapper for User conversions.
 */
@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "roles", expression = "java(user.getRoles().stream().map(com.abhiiterates.os.user.Role::getName).toList())")
    UserProfileDto toUserProfileDto(User user);
}
