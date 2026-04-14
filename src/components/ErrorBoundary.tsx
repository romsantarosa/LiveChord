import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let message = 'Ocorreu um erro inesperado.';
      try {
        const parsed = JSON.parse(this.state.error?.message || '');
        if (parsed.error && parsed.error.includes('permissions')) {
          message = 'Você não tem permissão para realizar esta ação.';
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
          <div className="max-w-md">
            <h2 className="text-2xl font-black text-white mb-4">Ops! Algo deu errado.</h2>
            <p className="text-zinc-500 mb-8">{message}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-500 text-black px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest"
            >
              Recarregar App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
