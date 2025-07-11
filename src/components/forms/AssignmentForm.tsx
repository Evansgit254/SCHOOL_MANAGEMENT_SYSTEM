"use client";
import { Dispatch, SetStateAction } from "react";

const AssignmentForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  return (
    <form className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new assignment" : "Update the assignment"}
      </h1>
      {/* Add your assignment form fields here */}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default AssignmentForm; 