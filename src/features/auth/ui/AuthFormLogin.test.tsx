import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthFormLogin } from "./AuthFormLogin";

describe("AuthFormLogin", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onForgotPassword: vi.fn(),
    onSwitchToRegister: vi.fn(),
  };

  it("should render login form with all fields", () => {
    render(<AuthFormLogin {...defaultProps} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /forgot password/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  it("should validate email format on submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<AuthFormLogin {...defaultProps} onSubmit={onSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /log in/i });

    await user.type(emailInput, "invalid-email");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("should validate password is not empty on submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<AuthFormLogin {...defaultProps} onSubmit={onSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button", { name: /log in/i });

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password is too short \(min 8 chars\)/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("should submit form with valid credentials", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AuthFormLogin {...defaultProps} onSubmit={onSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /log in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("should display error banner when error prop is provided", () => {
    const error = "Invalid credentials";
    render(<AuthFormLogin {...defaultProps} error={error} />);

    expect(screen.getByText(error)).toBeInTheDocument();
  });

  it("should call onErrorDismiss when error banner is dismissed", async () => {
    const user = userEvent.setup();
    const onErrorDismiss = vi.fn();

    render(<AuthFormLogin {...defaultProps} error="Test error" onErrorDismiss={onErrorDismiss} />);

    const dismissButton = screen.getByRole("button", { name: /dismiss error/i });
    await user.click(dismissButton);

    expect(onErrorDismiss).toHaveBeenCalled();
  });

  it("should disable form fields and button when isLoading is true", () => {
    render(<AuthFormLogin {...defaultProps} isLoading={true} />);

    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/password/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /logging in/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /forgot password/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeDisabled();
  });

  it("should call onForgotPassword when forgot password button is clicked", async () => {
    const user = userEvent.setup();
    const onForgotPassword = vi.fn();

    render(<AuthFormLogin {...defaultProps} onForgotPassword={onForgotPassword} />);

    const forgotPasswordButton = screen.getByRole("button", {
      name: /forgot password/i,
    });
    await user.click(forgotPasswordButton);

    expect(onForgotPassword).toHaveBeenCalled();
  });

  it("should call onSwitchToRegister when sign up button is clicked", async () => {
    const user = userEvent.setup();
    const onSwitchToRegister = vi.fn();

    render(<AuthFormLogin {...defaultProps} onSwitchToRegister={onSwitchToRegister} />);

    const signUpButton = screen.getByRole("button", { name: /sign up/i });
    await user.click(signUpButton);

    expect(onSwitchToRegister).toHaveBeenCalled();
  });

  it("should clear validation errors on successful validation", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AuthFormLogin {...defaultProps} onSubmit={onSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /log in/i });

    await user.type(emailInput, "invalid-email");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });

    await user.clear(emailInput);
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(/invalid email address/i)).not.toBeInTheDocument();
    });

    expect(onSubmit).toHaveBeenCalled();
  });
});
