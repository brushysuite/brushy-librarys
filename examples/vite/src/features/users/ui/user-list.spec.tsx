import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserList } from "./user-list";

describe("UserList", () => {
  it("renders user names", () => {
    render(
      <UserList
        users={[
          { id: "1", name: "Ana" },
          { id: "2", name: "Bruno" },
        ]}
      />,
    );

    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Bruno")).toBeInTheDocument();
  });
});
