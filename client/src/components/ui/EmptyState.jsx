import { Inbox, Search, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toErrorMessage } from '../../utils/errorMessage';

export default function EmptyState({ type = 'default', title, description, action }) {
  const configs = {
    default: {
      icon: Inbox,
      iconColor: 'text-deadlock-muted',
    },
    noMatches: {
      icon: Search,
      iconColor: 'text-deadlock-accent',
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-deadlock-red',
    },
    loading: {
      icon: null,
      iconColor: '',
    },
  };

  const config = configs[type] || configs.default;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      {Icon && (
        <div className={`mb-6 p-4 bg-deadlock-bg rounded-full border border-deadlock-border ${config.iconColor}`}>
          <Icon className="w-10 h-10" />
        </div>
      )}
      
      {title && (
        <h3 className="text-lg font-serif tracking-widest text-white uppercase mb-2">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="text-deadlock-text-dim text-sm max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}
      
      {action && (
        <div className="flex gap-3">
          {action}
        </div>
      )}
    </div>
  );
}

// Pre-configured empty states for common scenarios
export function NoMatchesEmptyState({ accountId }) {
  return (
    <EmptyState
      type="noMatches"
      title="No Matches Found"
      description={`No matches found for account ${accountId}. Make sure the Steam ID is correct and the player has recent Deadlock matches.`}
      action={
        <Link to="/" className="btn-primary text-sm">
          Enter New Steam ID
        </Link>
      }
    />
  );
}

export function ErrorEmptyState({ message, onRetry }) {
  return (
    <EmptyState
      type="error"
      title="Something Went Wrong"
      description={toErrorMessage(message, 'An unexpected error occurred while loading your data.')}
      action={
        onRetry ? (
          <button onClick={onRetry} className="btn-secondary text-sm">
            Try Again
          </button>
        ) : (
          <Link to="/" className="btn-primary text-sm">
            Return Home
          </Link>
        )
      }
    />
  );
}

export function LoadingEmptyState() {
  return (
    <EmptyState
      type="loading"
      title="Loading..."
      description="Fetching your match data from Deadlock servers."
    />
  );
}
