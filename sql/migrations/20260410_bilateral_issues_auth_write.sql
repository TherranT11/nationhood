-- Fix: bilateral_issues and bilateral_issue_modifiers only had service_role
-- write policies. Player actions via executeIssueAction() run as authenticated
-- users, so updates to tension/favor and modifier removal were silently blocked
-- by RLS — the action recorded in history but never persisted to the issue row.

-- Allow authenticated users to update bilateral_issues (tension, favor, status)
CREATE POLICY "bilateral_issues_auth_update"
    ON bilateral_issues FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to update bilateral_issue_modifiers (remove/resolve)
CREATE POLICY "bilateral_issue_modifiers_auth_update"
    ON bilateral_issue_modifiers FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to insert bilateral_issue_modifiers (action spawns new modifiers)
CREATE POLICY "bilateral_issue_modifiers_auth_insert"
    ON bilateral_issue_modifiers FOR INSERT
    TO authenticated
    WITH CHECK (true);
