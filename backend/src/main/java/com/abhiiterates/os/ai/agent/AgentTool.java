package com.abhiiterates.os.ai.agent;

import java.lang.annotation.*;

@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface AgentTool {
    String name() default "";
    String description();
}
