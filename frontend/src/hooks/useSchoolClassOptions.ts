import { useEffect, useState } from "react";
import { getSchoolProfile } from "@/src/lib/authApi";
import { getRegisteredSchoolClassOptions, getSchoolTypeClassOptions } from "@/src/lib/schoolTypes";

export const useSchoolClassOptions = () => {
  const [classOptions, setClassOptions] = useState<string[]>(getSchoolTypeClassOptions("K12"));
  const [schoolTypeName, setSchoolTypeName] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadSchoolType = async () => {
      try {
        const response = await getSchoolProfile();
        const settings = response.school.settings;
        if (!isMounted) return;
        setClassOptions(getRegisteredSchoolClassOptions(response.school.school_type, settings));
        setSchoolTypeName(String(settings?.school_type_name || ""));
      } catch {
        if (isMounted) {
          setClassOptions(getSchoolTypeClassOptions("K12"));
          setSchoolTypeName("");
        }
      }
    };

    void loadSchoolType();

    return () => {
      isMounted = false;
    };
  }, []);

  return { classOptions, schoolTypeName };
};
