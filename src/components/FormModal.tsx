"use client";

import React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "react-toastify";
import { FormContainerProps } from "./FormContainer";

// USE LAZY LOADING

// import TeacherForm from "./forms/TeacherForm";
// import StudentForm from "./forms/StudentForm";

const TeacherForm = dynamic(() => import("./forms/TeacherForm"), {
  loading: () => <h1>Loading...</h1>,
});
const StudentForm = dynamic(() => import("./forms/StudentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const SubjectForm = dynamic(() => import("./forms/SubjectForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ClassForm = dynamic(() => import("./forms/ClassForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ExamForm = dynamic(() => import("./forms/ExamForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AnnouncementForm = dynamic(() => import("./forms/AnnouncementForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AssignmentForm = dynamic(() => import("./forms/AssignmentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AttendanceForm = dynamic(() => import("./forms/AttendanceForm"), {
  loading: () => <h1>Loading...</h1>,
});
const EventForm = dynamic(() => import("./forms/EventForm"), {
  loading: () => <h1>Loading...</h1>,
});
const LessonForm = dynamic(() => import("./forms/LessonForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ParentForm = dynamic(() => import("./forms/ParentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ResultForm = dynamic(() => import("./forms/ResultForm"), {
  loading: () => <h1>Loading...</h1>,
});
// TODO: OTHER FORMS

const forms: {
  [key: string]: (
    setOpen: Dispatch<SetStateAction<boolean>>,
    type: "create" | "update",
    data?: unknown,
    relatedData?: unknown
  ) => React.ReactElement;
} = {
  subject: (setOpen, type, data, relatedData) => (
    <SubjectForm
      type={type}
      data={data as import("@/lib/formValidationSchemas").SubjectSchema}
      setOpen={setOpen}
      relatedData={relatedData as import("./FormContainer").RelatedData}
    />
  ),
  class: (setOpen, type, data, relatedData) => (
    <ClassForm
      type={type}
      data={data as import("@/lib/formValidationSchemas").ClassSchema}
      setOpen={setOpen}
      relatedData={relatedData as import("./FormContainer").RelatedData}
    />
  ),
  teacher: (setOpen, type, data, relatedData) => (
    <TeacherForm
      type={type}
      data={data as import("@/lib/formValidationSchemas").TeacherSchema}
      setOpen={setOpen}
      relatedData={relatedData as import("./FormContainer").RelatedData}
    />
  ),
  student: (setOpen, type, data, relatedData) => (
    <StudentForm
      type={type}
      data={data as import("@/lib/formValidationSchemas").StudentSchema}
      setOpen={setOpen}
      relatedData={relatedData as import("./FormContainer").RelatedData}
    />
  ),
  exam: (setOpen, type, data, relatedData) => (
    <ExamForm
      type={type}
      data={data as import("@/lib/formValidationSchemas").ExamSchema}
      setOpen={setOpen}
      relatedData={relatedData as import("./FormContainer").RelatedData}
    />
  ),
  announcement: (setOpen, type) => (
    <AnnouncementForm
      type={type}
    />
  ),
  assignment: (setOpen, type) => (
    <AssignmentForm
      type={type}
    />
  ),
  attendance: (setOpen, type) => (
    <AttendanceForm
      type={type}
    />
  ),
  event: (setOpen, type) => (
    <EventForm
      type={type}
    />
  ),
  lesson: (setOpen, type) => (
    <LessonForm
      type={type}
    />
  ),
  parent: (setOpen, type) => (
    <ParentForm
      type={type}
    />
  ),
  result: (setOpen, type) => (
    <ResultForm
      type={type}
    />
  ),
};

const FormModal = ({
  table,
  type,
  data,
  id,
  relatedData,
}: FormContainerProps & { relatedData?: unknown }) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor =
    type === "create"
      ? "bg-lamaYellow"
      : type === "update"
      ? "bg-lamaSky"
      : "bg-lamaPurple";

  const [open, setOpen] = useState(false);

  const handleDelete = async (table: string, id: string | number) => {
    try {
      const response = await fetch(`/api/${table}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(`${table} deleted successfully!`);
        setOpen(false);
      } else {
        toast.error(`Failed to delete ${table}. Please try again later.`);
      }
    } catch (error) {
      toast.error(`An error occurred: ${(error as Error).message}`);
    }
  };

  const Form = () => {
    return type === "delete" && id ? (
      <form onSubmit={(e) => {
        e.preventDefault();
        handleDelete(table, id);
      }} className="p-4 flex flex-col gap-4">
        <input type="hidden" name="id" value={id} />
        <span className="text-center font-medium">
          All data will be lost. Are you sure you want to delete this {table}?
        </span>
        <button className="bg-red-700 text-white py-2 px-4 rounded-md border-none w-max self-center">
          Delete
        </button>
      </form>
    ) : type === "create" || type === "update" ? (
      forms[table](setOpen, type, data, relatedData)
    ) : (
      "Form not found!"
    );
  };

  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
        onClick={() => setOpen(true)}
      >
        <Image src={`/${type}.png`} alt="" width={16} height={16} />
      </button>
      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]">
            <Form />
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;