import { render, screen } from '@testing-library/react';

import AboutPage from '@/app/about/page';
import DemoPage from '@/app/demo/page';
import PricingPage from '@/app/pricing/page';
import RoadmapPage from '@/app/roadmap/page';
import UseCasesPage from '@/app/use-cases/page';

describe('Sales package pages', () => {
  it('renders the about page value narrative', () => {
    render(<AboutPage />);

    expect(screen.getByRole('heading', { name: /skillflow ai/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /problema/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /roadmap ia/i })).toBeInTheDocument();
  });

  it('renders the guided demo page with CTA', () => {
    render(<DemoPage />);

    expect(screen.getByRole('heading', { name: /demostración guiada skillflow ai/i })).toBeInTheDocument();
    expect(screen.getByText(/7 minutos/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /ingresar a la demo/i })[0]).toHaveAttribute('href', '/login');
  });

  it('renders use cases for core target segments', () => {
    render(<UseCasesPage />);

    expect(screen.getByRole('heading', { name: /casos de uso/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /minería/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /otec/i })).toBeInTheDocument();
  });

  it('renders roadmap stages', () => {
    render(<RoadmapPage />);

    expect(screen.getByRole('heading', { name: /roadmap/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /disponible hoy/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /futuro/i })).toBeInTheDocument();
  });

  it('renders initial pricing plans without fixed prices', () => {
    render(<PricingPage />);

    expect(screen.getByRole('heading', { name: /pricing/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /starter/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /solicitar cotización/i })).toHaveLength(3);
  });
});
