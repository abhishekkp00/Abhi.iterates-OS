package com.abhiiterates.os.ai.agent;

import java.lang.annotation.*;

@Target({ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface ToolParam {
    String description();
    boolean required() default true;
}
