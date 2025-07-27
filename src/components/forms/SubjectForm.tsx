"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { subjectSchema, SubjectSchema } from "@/lib/formValidationSchemas";
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { RelatedData } from "../FormContainer";
import { Teacher } from "@prisma/client";

const SubjectForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: SubjectSchema;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: RelatedData;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubjectSchema>({
    resolver: zodResolver(subjectSchema),
  });

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { teachers } = relatedData || {};

  const onSubmit = async (formData: SubjectSchema) => {
    setLoading(true);
    try {
      const method = type === "create" ? "POST" : "PUT";
      const res = await fetch("/api/subjects", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.success) {
        toast(`Subject has been ${type === "create" ? "created" : "updated"}!`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Something went wrong!");
      }
    } catch (error) {
      toast.error(`Something went wrong: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new subject" : "Update the subject"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Subject name"
          defaultValue={data?.name}
          {...register("name")}
          error={errors?.name?.message}
        />
        {data && (
          <InputField
            defaultValue={data?.id}
            {...register("id", { valueAsNumber: true })}
            error={errors?.id?.message}
            hidden
          />
        )}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Teachers</label>
          <select
            multiple
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("teachers")}
            defaultValue={data?.teachers}
          >
            {teachers?.map(
              (teacher: Teacher) => (
                <option value={teacher.id} key={teacher.id}>
                  {teacher.name + " " + teacher.surname}
                </option>
              )
            )}
          </select>
          {errors.teachers?.message && (
            <p className="text-xs text-red-400">
              {errors.teachers.message}
            </p>
          )}
        </div>
      </div>
      <button className="bg-blue-400 text-white p-2 rounded-md" disabled={loading}>
        {loading
          ? type === "create"
            ? "Creating..."
            : "Updating..."
          : type === "create"
          ? "Create"
          : "Update"}
      </button>
    </form>
  );
};

export default SubjectForm;