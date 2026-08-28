import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { Button } from '../../components/ui/Button';

export function NotFound() {
  return (
    <PublicLayout>
      <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-24 text-center">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">
          Error 404
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-navy-900">
          This page could not be found
        </h1>
        <p className="mt-2 text-[13px] text-slate-600">
          The link may be out of date, or the record may no longer be visible to your role.
        </p>
        <Link to="/" className="mt-6">
          <Button>Return to the home page</Button>
        </Link>
      </div>
    </PublicLayout>);

}