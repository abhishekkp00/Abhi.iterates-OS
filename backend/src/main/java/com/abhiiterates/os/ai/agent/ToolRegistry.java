package com.abhiiterates.os.ai.agent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.definition.DefaultToolDefinition;
import org.springframework.ai.tool.definition.ToolDefinition;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.*;

@Component
@Slf4j
@RequiredArgsConstructor
public class ToolRegistry implements ApplicationContextAware {

    private ApplicationContext applicationContext;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Getter
    private final Map<String, ToolDefinitionHolder> tools = new HashMap<>();

    private static final ThreadLocal<ExecutionContext> CONTEXT_HOLDER = new ThreadLocal<>();

    public static void setContext(ExecutionContext context) {
        CONTEXT_HOLDER.set(context);
    }

    public static ExecutionContext getContext() {
        return CONTEXT_HOLDER.get();
    }

    public static void clearContext() {
        CONTEXT_HOLDER.remove();
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
    }

    @PostConstruct
    public void init() {
        log.info("Scanning application context for Agent Tools...");
        String[] beanNames = applicationContext.getBeanDefinitionNames();
        for (String name : beanNames) {
            try {
                Object bean = applicationContext.getBean(name);
                Class<?> clazz = bean.getClass();
                
                // Handle Spring CGLIB proxy classes
                if (clazz.getName().contains("$$")) {
                    clazz = clazz.getSuperclass();
                }
                
                for (Method method : clazz.getDeclaredMethods()) {
                    if (method.isAnnotationPresent(AgentTool.class)) {
                        AgentTool annotation = method.getAnnotation(AgentTool.class);
                        String toolName = annotation.name().isEmpty() ? method.getName() : annotation.name();
                        String description = annotation.description();
                        String schema = generateSchema(method);
                        
                        ToolDefinition def = new DefaultToolDefinition(toolName, description, schema);
                        ToolDefinitionHolder holder = new ToolDefinitionHolder(def, bean, method);
                        tools.put(toolName, holder);
                        log.info("Registered Agent Tool: [{}] -> {}.{}() with schema: {}", toolName, clazz.getSimpleName(), method.getName(), schema);
                    }
                }
            } catch (Exception e) {
                // Ignore beans that fail to initialize/get in this lifecycle phase
            }
        }
    }

    public List<ToolCallback> getCallbacks() {
        List<ToolCallback> callbacks = new ArrayList<>();
        for (ToolDefinitionHolder holder : tools.values()) {
            callbacks.add(new ToolCallback() {
                @Override
                public ToolDefinition getToolDefinition() {
                    return holder.getDefinition();
                }

                @Override
                public String call(String arguments) {
                    ExecutionContext ctx = getContext();
                    if (ctx != null && ctx.getListener() != null) {
                        try {
                            ctx.getListener().onToolStarted(holder.getDefinition().name(), arguments);
                        } catch (Exception ignored) {}
                    }
                    try {
                        log.info("Invoking tool {} with arguments {}", holder.getDefinition().name(), arguments);
                        Object[] args = resolveArguments(holder.getMethod(), arguments);
                        Object result = holder.getMethod().invoke(holder.getBean(), args);
                        String response = objectMapper.writeValueAsString(result);
                        log.info("Tool {} executed successfully. Response size: {}", holder.getDefinition().name(), response.length());
                        if (ctx != null && ctx.getListener() != null) {
                            try {
                                ctx.getListener().onToolCompleted(holder.getDefinition().name(), response);
                            } catch (Exception ignored) {}
                        }
                        return response;
                    } catch (Exception e) {
                        log.error("Error executing tool " + holder.getDefinition().name(), e);
                        String errResponse = "{\"success\":false,\"error\":\"Execution failed: " + escapeJson(e.getMessage()) + "\"}";
                        if (ctx != null && ctx.getListener() != null) {
                            try {
                                ctx.getListener().onToolCompleted(holder.getDefinition().name(), errResponse);
                            } catch (Exception ignored) {}
                        }
                        return errResponse;
                    }
                }
            });
        }
        return callbacks;
    }

    private Object[] resolveArguments(Method method, String argumentsJson) throws Exception {
        JsonNode node = objectMapper.readTree(argumentsJson);
        Parameter[] parameters = method.getParameters();
        Object[] args = new Object[parameters.length];
        
        for (int i = 0; i < parameters.length; i++) {
            Parameter param = parameters[i];
            Class<?> type = param.getType();
            
            if (type.equals(ExecutionContext.class)) {
                args[i] = getContext();
                continue;
            }
            
            String name = param.getName();
            JsonNode valNode = node.get(name);
            
            if (valNode == null || valNode.isNull()) {
                args[i] = null;
                continue;
            }
            
            if (type.equals(String.class)) {
                args[i] = valNode.asText();
            } else if (type.equals(Integer.class) || type.equals(int.class)) {
                args[i] = valNode.asInt();
            } else if (type.equals(Long.class) || type.equals(long.class)) {
                args[i] = valNode.asLong();
            } else if (type.equals(Double.class) || type.equals(double.class)) {
                args[i] = valNode.asDouble();
            } else if (type.equals(Boolean.class) || type.equals(boolean.class)) {
                args[i] = valNode.asBoolean();
            } else {
                args[i] = objectMapper.treeToValue(valNode, type);
            }
        }
        return args;
    }

    private String generateSchema(Method method) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"type\":\"object\",\"properties\":{");
        boolean first = true;
        List<String> requiredList = new ArrayList<>();
        
        for (Parameter param : method.getParameters()) {
            if (param.getType().equals(ExecutionContext.class)) {
                continue;
            }
            
            ToolParam toolParam = param.getAnnotation(ToolParam.class);
            String desc = toolParam != null ? toolParam.description() : "";
            boolean req = toolParam == null || toolParam.required();
            String name = param.getName();
            
            if (!first) sb.append(",");
            first = false;
            
            String type = "string";
            Class<?> pType = param.getType();
            if (pType == Integer.class || pType == int.class || pType == Long.class || pType == long.class || pType == Double.class || pType == double.class) {
                type = "number";
            } else if (pType == Boolean.class || pType == boolean.class) {
                type = "boolean";
            }
            
            sb.append(String.format("\"%s\":{\"type\":\"%s\",\"description\":\"%s\"}", name, type, escapeJson(desc)));
            if (req) {
                requiredList.add(name);
            }
        }
        sb.append("}");
        if (!requiredList.isEmpty()) {
            sb.append(",\"required\":[");
            for (int i = 0; i < requiredList.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append(String.format("\"%s\"", requiredList.get(i)));
            }
            sb.append("]");
        }
        sb.append("}");
        return sb.toString();
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r");
    }

    @Getter
    @RequiredArgsConstructor
    public static class ToolDefinitionHolder {
        private final ToolDefinition definition;
        private final Object bean;
        private final Method method;
    }
}
