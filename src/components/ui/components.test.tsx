import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Badge } from "./badge";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Checkbox } from "./checkbox";
import { Dialog, DialogContent, DialogTrigger } from "./dialog";
import { Input } from "./input";
import { Label } from "./label";
import { Separator } from "./separator";
import { Skeleton } from "./skeleton";
import { Switch } from "./switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Textarea } from "./textarea";

describe("Shadcn UI Components Suite", () => {
  it("renders Input and Textarea with accessible values", () => {
    render(
      <div>
        <Label htmlFor="test-input">Test Input</Label>
        <Input id="test-input" placeholder="Type here..." />
        <Textarea id="test-textarea" placeholder="Type long text..." />
      </div>
    );
    expect(screen.getByPlaceholderText("Type here...")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Type long text...")
    ).toBeInTheDocument();
  });

  it("renders Card with Title and Content", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
        <CardContent>Card body content</CardContent>
      </Card>
    );
    expect(screen.getByText("Card Title")).toBeInTheDocument();
    expect(screen.getByText("Card body content")).toBeInTheDocument();
  });

  it("renders Badge variants correctly", () => {
    render(
      <div>
        <Badge variant="default">Default</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="destructive">Error</Badge>
      </div>
    );
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("renders Table structure properly", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Header 1</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Data 1</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByText("Header 1")).toBeInTheDocument();
    expect(screen.getByText("Data 1")).toBeInTheDocument();
  });

  it("renders Tabs and handles tab switching", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    expect(screen.getByText("Content 1")).toBeInTheDocument();
    expect(screen.queryByText("Content 2")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Tab 2"));
    expect(screen.getByText("Content 2")).toBeInTheDocument();
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
  });

  it("renders Checkbox and Switch", () => {
    render(
      <div>
        <Checkbox aria-label="terms" />
        <Switch aria-label="notifications" />
      </div>
    );
    expect(screen.getByRole("checkbox", { name: "terms" })).toBeInTheDocument();
    expect(
      screen.queryByRole("switch", { name: "notifications" }) ??
        screen.getByRole("checkbox", { name: "notifications" })
    ).toBeInTheDocument();
  });

  it("renders Alert, Separator, and Skeleton", () => {
    render(
      <div>
        <Alert variant="destructive">
          <AlertTitle>Error Title</AlertTitle>
          <AlertDescription>Error detail</AlertDescription>
        </Alert>
        <Separator />
        <Skeleton className="h-4 w-10" data-testid="skeleton" />
      </div>
    );
    expect(screen.getByText("Error Title")).toBeInTheDocument();
    expect(screen.getByText("Error detail")).toBeInTheDocument();
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });

  it("renders Dialog and opens content on trigger click", () => {
    render(
      <Dialog>
        <DialogTrigger>Open Modal</DialogTrigger>
        <DialogContent>
          <div>Modal Inner Content</div>
        </DialogContent>
      </Dialog>
    );
    expect(screen.queryByText("Modal Inner Content")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Open Modal"));
    expect(screen.getByText("Modal Inner Content")).toBeInTheDocument();
  });
});
