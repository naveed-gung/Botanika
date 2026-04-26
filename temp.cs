using System;
using System.Threading.Tasks;
using Botanika_Desktop.Firebase;
using Botanika_Desktop.Firebase.Models;

public class Test
{
    public static void Main()
    {
        try {
            var task = FirebaseService.Instance.GetAllAsync<Product>(""products"");
            task.Wait();
            Console.WriteLine(""Success: "" + task.Result.Count);
        } catch (Exception ex) {
            Console.WriteLine(""Error: "" + ex.ToString());
        }
    }
}
