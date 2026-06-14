import { useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Eye,
  Globe,
  Linkedin,
  Lock,
  Mail,
  Phone,
  Shield,
  UploadCloud,
  User,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Register from "../components/layout/Register";
import { BrandSelect } from "../HtmlComponents/HtmlSelect";
import HtmlInput from "../HtmlComponents/HtmlInput";
import { HtmlProgess } from "../HtmlComponents/HtmlProgress";

const inputClass =
  "h-[47px] w-full rounded-lg border border-[#d9e2f2] bg-white px-11 text-sm font-medium text-[#202337] outline-none transition placeholder:text-[#95a3ba] focus:border-[#5068f2] focus:ring-4 focus:ring-[#5068f2]/10";
const labelClass = "mb-2 block text-xs font-black text-[#202337]";

function StepOne() {
  return (
    <>
      <HtmlProgess step={1} />
      <div className="mt-16">
        <h2 className="text-[30px] font-black tracking-normal text-[#202337]">Create your account</h2>
        <p className="mt-6 text-base font-medium text-[#65758f]">Let's get your company set up on Collune.</p>
      </div>
      <div className="mt-12 grid gap-6">

        <HtmlInput labelClass={labelClass} inputClass={inputClass} label="Full Name" icon={<User className="h-5 w-5" />} placeholder="John Smith" />
        <HtmlInput labelClass={labelClass} inputClass={inputClass}  label="Work Email" icon={<Mail className="h-5 w-5" />} placeholder="john@company.com" type="email" />
        <HtmlInput labelClass={labelClass} inputClass={inputClass}  label="Phone Number" icon={<Phone className="h-5 w-5" />} placeholder="+91 9876543210" />
        <HtmlInput labelClass={labelClass} inputClass={inputClass}  label="Password" icon={<Lock className="h-5 w-5" />} value="••••••••••" type="password" trailing={<Eye className="h-5 w-5" />} />
        <HtmlInput labelClass={labelClass} inputClass={inputClass}  label="Confirm Password" icon={<Lock className="h-5 w-5" />} value="••••••••••" type="password" trailing={<Eye className="h-5 w-5" />} />
        <label className="flex items-center gap-3 text-sm font-medium text-[#65758f]">
          <input type="checkbox" className="h-4 w-4 rounded border-[#9aa7ba]" />
          I agree to the <a className="text-[#4462ff]" href="#">Terms & Privacy Policy</a>
        </label>
      </div>
    </>
  );
}

function StepTwo() {
  return (
    <>
      <HtmlProgess step={2} />
      <div className="mt-12">
        <h2 className="text-[30px] font-black tracking-normal text-[#202337]">Company Information</h2>
        <p className="mt-6 text-base font-medium text-[#65758f]">Add a few details about your company.</p>
      </div>
      <div className="mt-7 grid gap-5">
        <HtmlInput labelClass={labelClass} inputClass={inputClass}  label="Company Name" icon={<Building2 className="h-5 w-5" />} value="Acme Labs" />
        <BrandSelect labelClass={labelClass} inputClass={inputClass} label="Industry" icon={<BriefcaseBusiness className="h-5 w-5" />} placeholder="Select industry" >
          <option>Technology</option>
          <option>Consumer Brand</option>
          <option>Finance</option>
          <option>Education</option>
        </BrandSelect>

        <HtmlInput labelClass={labelClass} inputClass={inputClass}  label="Company Website" icon={<Globe className="h-5 w-5" />} value="www.acmelabs.com" />
        <BrandSelect labelClass={labelClass} inputClass={inputClass} label="Company Size" icon={<Users className="h-5 w-5" />} placeholder="Select company size" >
          <option>1-2</option>
          <option>2-10</option>
          <option>10-50</option>
          <option>50 +</option>
        </BrandSelect>
        <HtmlInput labelClass={labelClass} inputClass={inputClass}  label="LinkedIn Company Page (Optional)" icon={<Linkedin className="h-5 w-5" />} placeholder="https://linkedin.com/company/acme-labs" />
        <label className="block">
          <span className={labelClass}>Company Logo <span className="text-[#95a3ba]">(Optional)</span></span>
          <span className="grid h-[148px] place-items-center rounded-lg border-2 border-dashed border-[#d9e2f2] text-center">
            <span>
              <UploadCloud className="mx-auto h-10 w-10 text-[#95a3ba]" />
              <strong className="mt-3 block text-sm font-black text-[#202337]">Upload your logo</strong>
              <span className="mt-2 block text-xs font-medium text-[#95a3ba]">PNG, JPG or SVG • Max size 2MB</span>
            </span>
          </span>
        </label>
      </div>
    </>
  );
}

function StepThree() {
  const rows = [
    [Building2, "Company Name", "Acme Labs", false],
    [BriefcaseBusiness, "Industry", "Technology", false],
    [Globe, "Website", "www.acmelabs.com", true],
    [Users, "Company Size", "11-50 Employees", false],
    [Linkedin, "LinkedIn Company Page", "linkedin.com/company/acme-labs", true],
    [Shield, "Verification Status", "Pending Review", false],
  ] as const;

  return (
    <>
      <HtmlProgess step={3} />
      <div className="mt-6 rounded-xl border border-[#dfe4ed] p-7">
        <div className="grid gap-7">
          {rows.map(([Icon, label, value, arrow]) => (
            <div key={label} className="flex items-center gap-5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e8e0ff] text-[#4b22f4]">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-[#65758f]">{label}</p>
                <p className="mt-1 text-base font-black text-black">
                  {value} {arrow ? <ArrowRight className="inline h-4 w-4 text-[#4b22f4]" /> : null}
                </p>
                {label === "Verification Status" ? (
                  <span className="mt-2 inline-block rounded bg-[#c9f5df] px-3 py-1 text-sm font-black text-[#00a875]">Pending Review</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-11 flex gap-5 rounded-xl bg-[#dfe8ff] p-6">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#4b22f4] text-xs font-black text-white">i</span>
        <div>
          <h3 className="font-black text-black">What happens next?</h3>
          <p className="mt-3 text-sm font-medium leading-relaxed text-[#65758f]">
            Our team will review your company details. Once verified, you'll be able to start creating campaigns and connecting with creators.
          </p>
        </div>
      </div>
    </>
  );
}

const BrandRegister = () => {
  const navigator = useNavigate();
  const [step, setStep] = useState(1);
  const next = () => setStep((current) => Math.min(3, current + 1));

  return (

    <Register
      step={step}
      children={<section className="border-l border-[#d7e0f2] px-10 py-14 md:px-[70px]">
        <form
          className="mx-auto max-w-[505px]"
          onSubmit={(event) => {
            event.preventDefault();
            next();
          }}
        >
          {step === 1 ? <StepOne /> : null}
          {step === 2 ? <StepTwo /> : null}
          {step === 3 ? <StepThree /> : null}

          <button
            type="submit"
            onclick={
              navigator('/brand-dashboard/')
            }
            className="mt-12 inline-flex h-[50px] w-full items-center justify-center gap-3 rounded-lg bg-[#4965f4] text-base font-black text-white shadow-[0_12px_22px_rgba(73,101,244,0.22)]"
          >
            {step === 3 ? "Go to dashboard" : "Continue"}
            <ArrowRight className="h-5 w-5" />
          </button>

          {step === 1 ? (
            <p className="mt-6 text-center text-sm font-medium text-[#65758f]">
              Already have an account? <a href="/login" className="text-[#4462ff]">Login</a>
            </p>
          ) : null}
        </form>
      </section>}
    />



  );
};

export default BrandRegister;
