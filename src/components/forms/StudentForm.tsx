"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useState } from "react";
import { studentSchema, StudentSchema } from "@/lib/formValidationSchemas";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";
import { RelatedData } from "../FormContainer";
import { Grade, Class } from "@prisma/client";

const StudentForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: StudentSchema;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: RelatedData;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentSchema>({
    resolver: zodResolver(studentSchema),
  });

  const [img, setImg] = useState<{ secure_url: string } | undefined>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { grades, classes } = relatedData || {};

  const onSubmit = async (formData: StudentSchema) => {
    setLoading(true);
    try {
      const method = type === "create" ? "POST" : "PUT";
      const res = await fetch("/api/students", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, img: img?.secure_url }),
      });
      const result = await res.json();
      if (result.success) {
        toast(`Student has been ${type === "create" ? "created" : "updated"}!`);
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
        {type === "create" ? "Create a new student" : "Update the student"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Authentication Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Username"
          defaultValue={data?.username}
          {...register("username")}
          error={errors?.username?.message}
        />
        <InputField
          label="Email"
          defaultValue={data?.email}
          {...register("email")}
          error={errors?.email?.message}
        />
        <InputField
          label="Password"
          type="password"
          defaultValue={data?.password}
          {...register("password")}
          error={errors?.password?.message}
        />
      </div>
      <span className="text-xs text-gray-400 font-medium">
        Personal Information
      </span>
      <CldUploadWidget
        uploadPreset="school"
        onSuccess={(result, { widget }) => {
          setImg((result?.info as { secure_url: string }) || undefined);
          widget.close();
        }}
      >
        {({ open }) => {
          return (
            <div
              className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer"
              onClick={() => open()}
            >
              <Image src="/upload.png" alt="" width={28} height={28} />
              <span>Upload a photo</span>
            </div>
          );
        }}
      </CldUploadWidget>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="First Name"
          defaultValue={data?.name}
          {...register("name")}
          error={errors.name?.message}
        />
        <InputField
          label="Last Name"
          defaultValue={data?.surname}
          {...register("surname")}
          error={errors.surname?.message}
        />
        <InputField
          label="Phone"
          defaultValue={data?.phone}
          {...register("phone")}
          error={errors.phone?.message}
        />
        <InputField
          label="Address"
          defaultValue={data?.address}
          {...register("address")}
          error={errors.address?.message}
        />
        <InputField
          label="Blood Type"
          defaultValue={data?.bloodType}
          {...register("bloodType")}
          error={errors.bloodType?.message}
        />
        <InputField
          label="Birthday"
          defaultValue={data?.birthday?.toString().split("T")[0]}
          {...register("birthday")}
          error={errors.birthday?.message}
          type="date"
        />
        <InputField
          label="Parent Id"
          defaultValue={data?.parentId}
          {...register("parentId")}
          error={errors.parentId?.message}
        />
        {data && (
          <InputField
            defaultValue={data?.id}
            {...register("id")}
            error={errors?.id?.message}
            hidden
          />
        )}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Sex</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("sex")}
            defaultValue={data?.sex}
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {errors.sex?.message && (
            <p className="text-xs text-red-400">
              {errors.sex.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Grade</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("gradeId", { valueAsNumber: true })}
            defaultValue={data?.gradeId}
          >
            {grades?.map((grade: Grade) => (
              <option value={grade.id} key={grade.id}>
                {grade.level}
              </option>
            ))}
          </select>
          {errors.gradeId?.message && (
            <p className="text-xs text-red-400">
              {errors.gradeId.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Class</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("classId", { valueAsNumber: true })}
            defaultValue={data?.classId}
          >
            {classes?.map((cls: Class) => (
              <option value={cls.id} key={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          {errors.classId?.message && (
            <p className="text-xs text-red-400">
              {errors.classId.message}
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

export default StudentForm;