package com.abhiiterates.os.productivity.service;

import com.abhiiterates.os.productivity.dto.CalendarEventRequest;
import com.abhiiterates.os.productivity.dto.CalendarEventResponse;
import com.abhiiterates.os.user.User;

import java.util.List;
import java.util.UUID;

public interface CalendarEventService {
    
    List<CalendarEventResponse> getAllEvents(User user);
    
    CalendarEventResponse getEventById(UUID id, User user);
    
    CalendarEventResponse createEvent(CalendarEventRequest request, User user);
    
    CalendarEventResponse updateEvent(UUID id, CalendarEventRequest request, User user);
    
    void deleteEvent(UUID id, User user);
}
