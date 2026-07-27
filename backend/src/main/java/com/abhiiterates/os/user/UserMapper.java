package com.abhiiterates.os.user;

import com.abhiiterates.os.user.dto.UserProfileDto;
import org.mapstruct.Mapper;

/**
 * MapStruct Mapper for User conversions.
 */
@Mapper(componentModel = "spring")
public interface UserMapper {

    UserProfileDto toUserProfileDto(User user);

    default String mapRoleToString(Role role) {
        return role != null ? role.getName() : null;
    }
}
