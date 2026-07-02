import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

type PagePlaceholderProps = {
  title: string;
  description?: string;
};

export function PagePlaceholder({
  title,
  description = "This page will be implemented in future stages.",
}: PagePlaceholderProps) {
  return (
    <section className="alios-page">
      <div className="alios-page-header">
        <h2 className="alios-page-title">{title}</h2>
        <p className="alios-page-description">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-7 text-muted-foreground">
            در این مرحله فقط مسیر، Layout و Placeholder صفحه آماده شده است.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
