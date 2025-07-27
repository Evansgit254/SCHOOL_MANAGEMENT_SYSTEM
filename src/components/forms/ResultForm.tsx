"use client";

const ResultForm = ({
  type,
}: {
  type: "create" | "update";
}) => {
  return (
    <form className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new result" : "Update the result"}
      </h1>
      {/* Add your result form fields here */}
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ResultForm; 