using System;
using System.Net.Http;
using System.Threading.Tasks;

public class Test
{
    public static void Main()
    {
        var http = new HttpClient();
        string url = "https://firestore.googleapis.com/v1/projects/botanika-7781d/databases/(default)/documents/products";
        var task = http.GetStringAsync(url);
        task.Wait();
        Console.WriteLine(task.Result);
    }
}
