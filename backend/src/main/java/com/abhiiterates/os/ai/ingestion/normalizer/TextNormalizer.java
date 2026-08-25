package com.abhiiterates.os.ai.ingestion.normalizer;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.regex.Pattern;

@Component
public class TextNormalizer {

    private static final Pattern CONTROL_CHARS = Pattern.compile("[\\p{Cntrl}&&[^\n\t]]");
    private static final Pattern HYPHENATED_LINEBREAK = Pattern.compile("(\\b[a-zA-Z]{2,})-\\n([a-zA-Z]{2,}\\b)");
    private static final Pattern MULTIPLE_SPACES = Pattern.compile("[\\t ]+");
    private static final Pattern MULTIPLE_NEWLINES = Pattern.compile("\\n{3,}");

    public String normalize(String input) {
        if (!StringUtils.hasText(input)) {
            return "";
        }

        // 1. Standardize carriage returns to newlines
        String text = input.replace("\r\n", "\n").replace("\r", "\n");

        // 2. Strip non-printable control characters
        text = CONTROL_CHARS.matcher(text).replaceAll("");

        // 3. Fix hyphenated line breaks (e.g. "oper-\nating" -> "operating")
        text = HYPHENATED_LINEBREAK.matcher(text).replaceAll("$1$2");

        // 4. Clean line by line (collapse horizontal spaces & trim trailing whitespace)
        String[] lines = text.split("\n", -1);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < lines.length; i++) {
            String line = MULTIPLE_SPACES.matcher(lines[i]).replaceAll(" ").trim();
            sb.append(line);
            if (i < lines.length - 1) {
                sb.append("\n");
            }
        }
        text = sb.toString();

        // 5. Collapse excessive blank lines (3+ newlines to 2 newlines for paragraph preservation)
        text = MULTIPLE_NEWLINES.matcher(text).replaceAll("\n\n");

        return text.trim();
    }
}
