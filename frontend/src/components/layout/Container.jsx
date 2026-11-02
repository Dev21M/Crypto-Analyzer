import React from 'react';
import { clsx } from 'clsx';
import { Button } from '../ui';

/**
 * Container component for consistent page layout
 */
export function Container({
  children,
  size = 'xl',
  className = '',
  as: Component = 'div',
  ...props
}) {
  const sizeClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-[1280px]',
    full: 'max-w-full',
  };

  const paddingClasses = {
    sm: 'px-4',
    md: 'px-6',
    lg: 'px-8',
  };

  return (
    <Component
      className={clsx(
        'container mx-auto',
        sizeClasses[size],
        paddingClasses.md,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * Page layout wrapper with header, sidebar, and content areas
 */
export function PageLayout({
  header,
  sidebar,
  footer,
  children,
  className = '',
  sidebarCollapsed = false,
  onSidebarToggle,
  ...props
}) {
  return (
    <div className={clsx('page-layout flex h-screen overflow-hidden', className)} {...props}>
      {sidebar && (
        <aside className={clsx('page-sidebar', sidebarCollapsed && 'collapsed')}>
          {sidebar}
        </aside>
      )}
      <div className="page-main flex-1 flex flex-col overflow-hidden min-w-0">
        {header && (
          <header className="page-header flex-shrink-0">
            {header}
          </header>
        )}
        <main className="page-content flex-1 overflow-y-auto">
          {children}
        </main>
        {footer && (
          <footer className="page-footer flex-shrink-0">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

/**
 * Section component for consistent vertical spacing
 */
export function Section({
  children,
  className = '',
  size = 'md',
  background,
  ...props
}) {
  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12 lg:py-16',
    lg: 'py-16 lg:py-24',
    xl: 'py-24 lg:py-32',
  };

  const backgroundClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    tertiary: 'bg-tertiary',
    muted: 'bg-muted/50',
    none: '',
  };

  return (
    <section
      className={clsx(
        'section',
        sizeClasses[size],
        backgroundClasses[background] || '',
        className
      )}
      {...props}
    >
      <Container size="xl">{children}</Container>
    </section>
  );
}

/**
 * Hero section for landing pages
 */
export function Hero({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  badge,
  illustration,
  className = '',
  ...props
}) {
  return (
    <Section size="xl" background="secondary" className={clsx('hero', className)} {...props}>
      <div className="hero-content grid lg:grid-cols-2 gap-12 items-center">
        <div className="hero-text text-center lg:text-left">
          {badge && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-bg text-primary text-sm font-medium mb-6">
              {badge}
            </span>
          )}
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-primary mb-6">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg lg:text-xl text-secondary mb-8 max-w-2xl mx-auto lg:mx-0">
              {subtitle}
            </p>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            {primaryAction && (
              <Button size="lg" className="w-full sm:w-auto" {...primaryAction} />
            )}
            {secondaryAction && (
              <Button variant="secondary" size="lg" className="w-full sm:w-auto" {...secondaryAction} />
            )}
          </div>
        </div>
        <div className="hero-illustration relative">
          {illustration}
        </div>
      </div>
    </Section>
  );
}

export default Container;