package com.abhiiterates.os.productivity.service;

import com.abhiiterates.os.exception.ResourceNotFoundException;
import com.abhiiterates.os.productivity.domain.CalendarEvent;
import com.abhiiterates.os.productivity.dto.CalendarEventRequest;
import com.abhiiterates.os.productivity.dto.CalendarEventResponse;
import com.abhiiterates.os.productivity.repository.CalendarEventRepository;
import com.abhiiterates.os.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CalendarEventServiceImpl implements CalendarEventService {

    private final CalendarEventRepository eventRepository;

    @Override
    public List<CalendarEventResponse> getAllEvents(User user) {
        return eventRepository.findAllByUser(user).stream()
            .map(CalendarEventResponse::fromEntity)
            .collect(Collectors.toList());
    }

    @Override
    public CalendarEventResponse getEventById(UUID id, User user) {
        CalendarEvent event = eventRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
        return CalendarEventResponse.fromEntity(event);
    }

    @Override
    @Transactional
    public CalendarEventResponse createEvent(CalendarEventRequest request, User user) {
        CalendarEvent event = CalendarEvent.builder()
            .title(request.title())
            .description(request.description())
            .startTime(request.startTime())
            .endTime(request.endTime())
            .location(request.location())
            .color(request.color() != null ? request.color() : "primary")
            .user(user)
            .build();
        CalendarEvent saved = eventRepository.save(event);
        return CalendarEventResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public CalendarEventResponse updateEvent(UUID id, CalendarEventRequest request, User user) {
        CalendarEvent event = eventRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));

        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());
        event.setLocation(request.location());
        event.setColor(request.color() != null ? request.color() : "primary");

        CalendarEvent updated = eventRepository.save(event);
        return CalendarEventResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    public void deleteEvent(UUID id, User user) {
        CalendarEvent event = eventRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
        eventRepository.delete(event);
    }
}
