import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * App-wide error boundary. Catches render errors and failed lazy-chunk loads
 * (e.g. after a deploy invalidates old hashes) and shows a recoverable screen
 * instead of a blank page. Text is bilingual without depending on i18n context,
 * since the provider may itself be above the thrown error.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface in the console for debugging; a real deployment would forward
    // this to an error-tracking service.
    console.error("Unhandled error:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign("/");
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-5xl">⚡</div>
        <h1 className="text-xl font-bold">حدث خطأ ما / Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          نعتذر، حدث خطأ غير متوقع. حاول إعادة تحميل الصفحة.
          <br />
          Sorry, an unexpected error occurred. Please reload.
        </p>
        <button
          onClick={this.handleReload}
          className="rounded-lg bg-accent px-5 py-2.5 font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          إعادة التحميل / Reload
        </button>
      </div>
    );
  }
}
