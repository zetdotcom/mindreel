import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthFormRegister } from "./AuthFormRegister";

describe("AuthFormRegister", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onSwitchToLogin: vi.fn(),
    onOpenRegulations: vi.fn(),
  };

  it("should render registration form with all fields", () => {
    render(<AuthFormRegister {...defaultProps} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password\*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /accept the terms of service/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("should validate email format on submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<AuthFormRegister {...defaultProps} onSubmit={onSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password\*/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const tosCheckbox = screen.getByRole("checkbox", {
      name: /accept the terms of service/i,
    });
    const submitButton = screen.getByRole("button", { name: /sign up/i });

    await user.type(emailInput, "invalid-email");
    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "password123");
    await user.click(tosCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("should validate password length on submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<AuthFormRegister {...defaultProps} onSubmit={onSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password\*/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const tosCheckbox = screen.getByRole("checkbox", {
      name: /accept the terms of service/i,
    });
    const submitButton = screen.getByRole("button", { name: /sign up/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "short");
    await user.type(confirmPasswordInput, "short");
    await user.click(tosCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password is too short \(min 8 chars\)/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("should validate password confirmation matches", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<AuthFormRegister {...defaultProps} onSubmit={onSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password\*/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const tosCheckbox = screen.getByRole("checkbox", {
      name: /accept the terms of service/i,
    });
    const submitButton = screen.getByRole("button", { name: /sign up/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "password456");
    await user.click(tosCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("should require TOS acceptance before submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<AuthFormRegister {...defaultProps} onSubmit={onSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password\*/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole("button", { name: /sign up/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/you must accept terms of service/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("should submit form with valid data and TOS accepted", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AuthFormRegister {...defaultProps} onSubmit={onSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password\*/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const tosCheckbox = screen.getByRole("checkbox", {
      name: /accept the terms of service/i,
    });
    const submitButton = screen.getByRole("button", { name: /sign up/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "password123");
    await user.click(tosCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        tosAccepted: true,
      });
    });
  });

  it("should display error banner when error prop is provided", () => {
    const error = "Email already registered";
    render(<AuthFormRegister {...defaultProps} error={error} />);

    expect(screen.getByText(error)).toBeInTheDocument();
  });

  it("should call onErrorDismiss when error banner is dismissed", async () => {
    const user = userEvent.setup();
    const onErrorDismiss = vi.fn();

    render(
      <AuthFormRegister {...defaultProps} error="Test error" onErrorDismiss={onErrorDismiss} />,
    );

    const dismissButton = screen.getByRole("button", { name: /dismiss error/i });
    await user.click(dismissButton);

    expect(onErrorDismiss).toHaveBeenCalled();
  });

  it("should disable all form fields when isLoading is true", () => {
    render(<AuthFormRegister {...defaultProps} isLoading={true} />);

    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/^password\*/i)).toBeDisabled();
    expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: /accept the terms of service/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /creating account/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /log in/i })).toBeDisabled();
  });

  it("should call onOpenRegulations when Terms of Service link is clicked", async () => {
    const user = userEvent.setup();
    const onOpenRegulations = vi.fn();

    render(<AuthFormRegister {...defaultProps} onOpenRegulations={onOpenRegulations} />);

    const tosLink = screen.getByRole("button", { name: /terms of service/i });
    await user.click(tosLink);

    expect(onOpenRegulations).toHaveBeenCalled();
  });

  it("should call onSwitchToLogin when log in button is clicked", async () => {
    const user = userEvent.setup();
    const onSwitchToLogin = vi.fn();

    render(<AuthFormRegister {...defaultProps} onSwitchToLogin={onSwitchToLogin} />);

    const loginButton = screen.getByRole("button", { name: /log in/i });
    await user.click(loginButton);

    expect(onSwitchToLogin).toHaveBeenCalled();
  });

  it("should clear validation errors on successful validation", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AuthFormRegister {...defaultProps} onSubmit={onSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password\*/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const tosCheckbox = screen.getByRole("checkbox", {
      name: /accept the terms of service/i,
    });
    const submitButton = screen.getByRole("button", { name: /sign up/i });

    await user.type(emailInput, "invalid-email");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });

    await user.clear(emailInput);
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "password123");
    await user.click(tosCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(/invalid email address/i)).not.toBeInTheDocument();
    });

    expect(onSubmit).toHaveBeenCalled();
  });

  it("should validate all fields simultaneously", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<AuthFormRegister {...defaultProps} onSubmit={onSubmit} />);

    const submitButton = screen.getByRole("button", { name: /sign up/i });

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/password is too short \(min 8 chars\)/i)).toBeInTheDocument();
      expect(screen.getByText(/you must accept terms of service/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
